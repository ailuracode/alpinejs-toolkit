import type {
  NormalizedPermissionState,
  PermissionAdapter,
  PermissionAvailability,
  PermissionListener,
  PermissionRequestResult,
} from "@ailuracode/alpine-permissions";
import { PermissionError } from "@ailuracode/alpine-permissions";

export const GEOLOCATION_PERMISSION_NAME = "geolocation" as const;

function isSecureContext(): boolean {
  return typeof globalThis !== "undefined" && globalThis.isSecureContext === true;
}

function hasGeolocationApi(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.geolocation?.getCurrentPosition === "function"
  );
}

function getAvailability(): PermissionAvailability {
  if (!isSecureContext()) {
    return "insecure-context";
  }

  if (!hasGeolocationApi()) {
    return "unsupported";
  }

  return "available";
}

async function queryGeolocationPermission(): Promise<NormalizedPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted" || status.state === "prompt" || status.state === "denied") {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

function requestGeolocationPrompt(): Promise<NormalizedPermissionState> {
  return new Promise((resolve) => {
    if (!hasGeolocationApi()) {
      resolve("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        resolve("granted");
      },
      (error) => {
        resolve(error.code === error.PERMISSION_DENIED ? "denied" : "prompt");
      },
      { maximumAge: Number.POSITIVE_INFINITY, timeout: 10_000 }
    );
  });
}

function unavailableGeoResult(
  availability: PermissionAvailability
): PermissionRequestResult<PermissionState> {
  return {
    permission: "denied",
    error: new PermissionError(
      availability === "insecure-context"
        ? "Geolocation requires a secure context"
        : "Geolocation is not supported",
      availability === "insecure-context"
        ? "PERMISSION_INSECURE_CONTEXT"
        : "PERMISSION_UNSUPPORTED",
      { permissionName: GEOLOCATION_PERMISSION_NAME }
    ),
  };
}

async function finalizeGeoRequest(
  permission: NormalizedPermissionState
): Promise<PermissionRequestResult<PermissionState>> {
  if (permission === "granted") {
    return { permission, result: "granted" };
  }

  if (permission === "denied") {
    return {
      permission,
      result: "denied",
      error: new PermissionError(
        "Geolocation permission is blocked — reset in browser site settings",
        "PERMISSION_DENIED",
        { permissionName: GEOLOCATION_PERMISSION_NAME }
      ),
    };
  }

  const prompted = await requestGeolocationPrompt();
  if (prompted === "granted") {
    return { permission: prompted, result: "granted" };
  }

  if (prompted === "denied") {
    return {
      permission: prompted,
      result: "denied",
      error: new PermissionError("Geolocation permission was denied", "PERMISSION_DENIED", {
        permissionName: GEOLOCATION_PERMISSION_NAME,
      }),
    };
  }

  return {
    permission: prompted,
    result: prompted === "unknown" ? "prompt" : prompted,
  };
}

/** Geolocation permission adapter for {@link PermissionsController}. */
export function createGeoPermissionAdapter(): PermissionAdapter<
  typeof GEOLOCATION_PERMISSION_NAME,
  PermissionState
> {
  return {
    name: GEOLOCATION_PERMISSION_NAME,
    requiresUserGesture: true,

    isSupported(): boolean {
      return getAvailability() === "available";
    },

    getAvailability(): PermissionAvailability {
      return getAvailability();
    },

    query(): Promise<NormalizedPermissionState> {
      return queryGeolocationPermission();
    },

    async request(): Promise<PermissionRequestResult<PermissionState>> {
      const availability = getAvailability();
      if (availability !== "available") {
        return unavailableGeoResult(availability);
      }

      const current = await queryGeolocationPermission();
      if (current === "granted" || current === "denied") {
        return finalizeGeoRequest(current);
      }

      return finalizeGeoRequest(await requestGeolocationPrompt());
    },

    async subscribe(listener: PermissionListener<PermissionState>) {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) {
        return () => {
          // Unsupported — no permission events.
        };
      }

      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        const notify = (): void => {
          void this.query().then((permission) => {
            listener({
              permission,
              availability: getAvailability(),
              requestState: "idle",
              canRequest: permission === "prompt" || permission === "unknown",
              requiresUserGesture: true,
              error: null,
              result: status.state,
            });
          });
        };

        notify();
        status.addEventListener("change", notify);
        return () => {
          status.removeEventListener("change", notify);
        };
      } catch {
        return () => {
          // Permission name unsupported — no change events.
        };
      }
    },
  };
}
