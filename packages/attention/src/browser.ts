import type { IdleDetectorConstructor, WakeLockLike } from "./types";

export type NavigatorWithWakeLock = Navigator & {
  wakeLock?: WakeLockLike;
};

export const IDLE_DETECTION_PERMISSION = "idle-detection" as PermissionName;

export function getWakeLockApi(): WakeLockLike | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  return (navigator as NavigatorWithWakeLock).wakeLock ?? null;
}

export function getIdleDetectorConstructor(): IdleDetectorConstructor | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const ctor = Reflect.get(globalThis, "IdleDetector");
  return typeof ctor === "function" ? (ctor as IdleDetectorConstructor) : null;
}

export async function readIdlePermissionStatus(): Promise<PermissionState | null> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return null;
  }
  try {
    const status = await navigator.permissions.query({ name: IDLE_DETECTION_PERMISSION });
    return status.state;
  } catch {
    return null;
  }
}
