import type {
  NormalizedPermissionState,
  PermissionAdapter,
  PermissionAvailability,
  PermissionListener,
  PermissionRequestResult,
} from "@ailuracode/alpine-permissions";
import { PermissionError } from "@ailuracode/alpine-permissions";
import {
  getNotifyPermission,
  isNotifySupported,
  requestNotifyPermission,
  requiresHomeScreenInstall,
  resolveNotifyConfig,
} from "./controller.js";
import type { NotifyPluginOptions } from "./types.js";

export const NOTIFICATION_PERMISSION_NAME = "notifications" as const;

function isSecureContext(): boolean {
  return typeof globalThis !== "undefined" && globalThis.isSecureContext === true;
}

function getAvailability(): PermissionAvailability {
  if (!isSecureContext()) {
    return "insecure-context";
  }

  if (requiresHomeScreenInstall()) {
    return "platform-restricted";
  }

  if (!isNotifySupported()) {
    return "unsupported";
  }

  return "available";
}

function unavailableNotificationResult(
  availability: PermissionAvailability
): PermissionRequestResult<NotificationPermission> {
  const code =
    availability === "insecure-context"
      ? "PERMISSION_INSECURE_CONTEXT"
      : availability === "platform-restricted"
        ? "PERMISSION_PLATFORM_RESTRICTED"
        : "PERMISSION_UNSUPPORTED";

  const message =
    availability === "platform-restricted"
      ? "Notifications require installing the app to the Home Screen on iOS"
      : "Notifications are not supported in this environment";

  return {
    permission: "denied",
    error: new PermissionError(message, code, {
      permissionName: NOTIFICATION_PERMISSION_NAME,
    }),
  };
}

function finalizeNotificationRequest(
  permission: NotificationPermission
): PermissionRequestResult<NotificationPermission> {
  const normalized = toNormalizedPermission(permission);

  if (normalized === "denied") {
    return {
      permission: normalized,
      result: permission,
      error: new PermissionError("Notification permission was denied", "PERMISSION_DENIED", {
        permissionName: NOTIFICATION_PERMISSION_NAME,
      }),
    };
  }

  return { permission: normalized, result: permission };
}

function toNormalizedPermission(permission: NotificationPermission): NormalizedPermissionState {
  if (permission === "granted" || permission === "denied" || permission === "default") {
    return permission === "default" ? "prompt" : permission;
  }

  return "unknown";
}

/** Notification permission adapter for {@link PermissionsController}. */
export function createNotificationPermissionAdapter(
  options: NotifyPluginOptions = {}
): PermissionAdapter<typeof NOTIFICATION_PERMISSION_NAME, NotificationPermission> {
  const config = resolveNotifyConfig(options);

  return {
    name: NOTIFICATION_PERMISSION_NAME,
    requiresUserGesture: true,

    isSupported(): boolean {
      return isNotifySupported();
    },

    getAvailability(): PermissionAvailability {
      return getAvailability();
    },

    query(): Promise<NormalizedPermissionState> {
      return Promise.resolve(toNormalizedPermission(getNotifyPermission()));
    },

    async request(): Promise<PermissionRequestResult<NotificationPermission>> {
      const availability = getAvailability();
      if (availability !== "available") {
        return unavailableNotificationResult(availability);
      }

      const current = getNotifyPermission();
      if (current === "granted" || current === "denied") {
        return { permission: toNormalizedPermission(current), result: current };
      }

      const permission = await requestNotifyPermission(config);
      return finalizeNotificationRequest(permission);
    },

    async subscribe(listener: PermissionListener<NotificationPermission>) {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) {
        return () => {
          // Unsupported — no permission events.
        };
      }

      try {
        const status = await navigator.permissions.query({ name: "notifications" });
        const notify = (): void => {
          const next = getNotifyPermission();
          void this.query().then((permission) => {
            listener({
              permission,
              availability: getAvailability(),
              requestState: "idle",
              canRequest: permission === "prompt" || permission === "unknown",
              requiresUserGesture: true,
              error: null,
              result: next,
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
