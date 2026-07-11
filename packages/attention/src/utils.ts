import { getIdleDetectorConstructor, getWakeLockApi } from "./browser.js";
import { DEFAULT_IDLE_THRESHOLD } from "./idle-controller.js";
import type { IdleMagic, WakeLockMagic } from "./types.js";

/** Reads whether the Screen Wake Lock API is available. */
export function isWakeLockSupported(): boolean {
  const wakeLock = getWakeLockApi();
  return wakeLock != null && typeof wakeLock.request === "function";
}

/** Reads whether the Idle Detection API is available. */
export function isIdleDetectionSupported(): boolean {
  const ctor = getIdleDetectorConstructor();
  return ctor != null && typeof ctor.requestPermission === "function";
}

/** Builds unavailable wake lock defaults for tests and SSR. */
export function createWakeLockState(
  supported = isWakeLockSupported()
): Pick<WakeLockMagic, "error" | "isRequesting" | "isActive" | "isSupported"> {
  return {
    error: null,
    isRequesting: false,
    isActive: false,
    isSupported: supported,
  };
}

/** Builds unavailable idle defaults for tests and SSR. */
export function createIdleState(
  supported = isIdleDetectionSupported()
): Pick<
  IdleMagic,
  | "userState"
  | "screenState"
  | "permission"
  | "error"
  | "threshold"
  | "isLoading"
  | "isWatching"
  | "isSupported"
> {
  return {
    userState: null,
    screenState: null,
    permission: null,
    error: null,
    threshold: DEFAULT_IDLE_THRESHOLD,
    isLoading: false,
    isWatching: false,
    isSupported: supported,
  };
}
