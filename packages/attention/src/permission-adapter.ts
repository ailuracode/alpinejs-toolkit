import type {
  NormalizedPermissionState,
  PermissionAdapter,
  PermissionAvailability,
  PermissionListener,
  PermissionRequestResult,
} from "@ailuracode/alpine-permissions";
import { PermissionError } from "@ailuracode/alpine-permissions";
import {
  getIdleDetectorConstructor,
  IDLE_DETECTION_PERMISSION,
  readIdlePermissionStatus,
} from "./browser.js";
import type { IdleDetectorConstructor } from "./types.js";

export const IDLE_PERMISSION_NAME = "idle-detection" as const;

function isSecureContext(): boolean {
  return typeof globalThis !== "undefined" && globalThis.isSecureContext === true;
}

function getAvailability(idleDetectorCtor: IdleDetectorConstructor | null): PermissionAvailability {
  if (!isSecureContext()) {
    return "insecure-context";
  }

  if (!idleDetectorCtor || typeof idleDetectorCtor.requestPermission !== "function") {
    return "unsupported";
  }

  return "available";
}

function toNormalizedPermission(state: PermissionState | null): NormalizedPermissionState {
  if (state === "granted" || state === "prompt" || state === "denied") {
    return state;
  }

  return "unknown";
}

function deniedIdleResult(
  permission: PermissionState,
  message: string
): PermissionRequestResult<PermissionState> {
  return {
    permission: "denied",
    result: permission,
    error: new PermissionError(message, "PERMISSION_DENIED", {
      permissionName: IDLE_PERMISSION_NAME,
    }),
  };
}

async function promptIdlePermission(
  ctor: IdleDetectorConstructor
): Promise<PermissionRequestResult<PermissionState>> {
  try {
    const permission = await ctor.requestPermission();
    const normalized = toNormalizedPermission(permission);

    if (normalized !== "granted") {
      const message =
        normalized === "denied"
          ? "Idle detection permission is blocked — reset in browser site settings"
          : "Idle detection permission was denied";
      return {
        permission: normalized,
        result: permission,
        error: new PermissionError(message, "PERMISSION_DENIED", {
          permissionName: IDLE_PERMISSION_NAME,
        }),
      };
    }

    return { permission: normalized, result: permission };
  } catch (error) {
    return {
      permission: "denied",
      error: new PermissionError(
        error instanceof Error ? error.message : "Failed to request idle permission",
        "PERMISSION_REQUEST_FAILED",
        { cause: error, permissionName: IDLE_PERMISSION_NAME }
      ),
    };
  }
}
export function createIdlePermissionAdapter(
  idleDetectorCtor?: IdleDetectorConstructor | null
): PermissionAdapter<typeof IDLE_PERMISSION_NAME, PermissionState> {
  const ctor = idleDetectorCtor ?? getIdleDetectorConstructor();

  return {
    name: IDLE_PERMISSION_NAME,
    requiresUserGesture: true,

    isSupported(): boolean {
      return getAvailability(ctor) === "available";
    },

    getAvailability(): PermissionAvailability {
      return getAvailability(ctor);
    },

    async query(): Promise<NormalizedPermissionState> {
      return toNormalizedPermission(await readIdlePermissionStatus());
    },

    async request(): Promise<PermissionRequestResult<PermissionState>> {
      const availability = getAvailability(ctor);
      if (availability !== "available" || !ctor) {
        return {
          permission: "denied",
          error: new PermissionError(
            "Idle Detection is not supported",
            availability === "insecure-context"
              ? "PERMISSION_INSECURE_CONTEXT"
              : "PERMISSION_UNSUPPORTED",
            { permissionName: IDLE_PERMISSION_NAME }
          ),
        };
      }

      const current = await readIdlePermissionStatus();
      if (current === "granted") {
        return { permission: "granted", result: current };
      }

      if (current === "denied") {
        return deniedIdleResult(
          current,
          "Idle detection permission is blocked — reset in browser site settings"
        );
      }

      return promptIdlePermission(ctor);
    },

    async subscribe(listener: PermissionListener<PermissionState>) {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) {
        return () => {
          // Unsupported — no permission events.
        };
      }

      try {
        const status = await navigator.permissions.query({ name: IDLE_DETECTION_PERMISSION });
        const notify = (): void => {
          void this.query().then((permission) => {
            listener({
              permission,
              availability: getAvailability(ctor),
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
