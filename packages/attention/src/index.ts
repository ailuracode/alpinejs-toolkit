import type AlpineType from "alpinejs";

export type IdleUserState = "active" | "idle";
export type IdleScreenState = "locked" | "unlocked";

export interface WakeLockSentinelLike {
  released: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  release(): Promise<void>;
}

export interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

export interface IdleDetectorLike {
  userState: IdleUserState;
  screenState: IdleScreenState;
  start(options?: { threshold?: number }): Promise<void>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface IdleDetectorConstructor {
  new (): IdleDetectorLike;
  requestPermission(): Promise<PermissionState>;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: WakeLockLike;
};

export interface WakeLockMagic {
  error: string | null;
  isRequesting: boolean;
  isActive: boolean;
  readonly isSupported: boolean;
  request(): Promise<boolean>;
  release(): Promise<boolean>;
}

export interface IdleMagic {
  userState: IdleUserState | null;
  screenState: IdleScreenState | null;
  permission: PermissionState | null;
  error: string | null;
  threshold: number;
  isLoading: boolean;
  isWatching: boolean;
  readonly isSupported: boolean;
  readonly isActive: boolean;
  readonly isIdle: boolean;
  requestPermission(): Promise<PermissionState>;
  start(options?: { threshold?: number }): Promise<boolean>;
  stop(): boolean;
}

export const DEFAULT_IDLE_THRESHOLD = 60_000;
export const MIN_IDLE_THRESHOLD = 60_000;

const IDLE_DETECTION_PERMISSION = "idle-detection" as PermissionName;

function idlePermissionError(permission: Exclude<PermissionState, "granted">): string {
  return permission === "denied"
    ? "Idle Detection permission is blocked. Reset it in your browser site settings and try again."
    : "Idle Detection permission was not granted";
}

/** Reads idle-detection permission from the Permissions API when available. */
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

async function syncIdlePermission(target: Pick<IdleMagic, "permission">): Promise<void> {
  if (target.permission === "granted") {
    return;
  }

  const queried = await readIdlePermissionStatus();
  if (queried != null) {
    target.permission = queried;
  }
}

async function promptIdlePermission(
  target: Pick<IdleMagic, "permission" | "error">,
  IdleDetectorCtor: IdleDetectorConstructor
): Promise<PermissionState> {
  try {
    const permission = await IdleDetectorCtor.requestPermission();
    target.permission = permission;

    if (permission === "granted") {
      target.error = null;
      return permission;
    }

    target.error = idlePermissionError(permission);
    return permission;
  } catch (error) {
    target.error = error instanceof Error ? error.message : "Failed to request idle permission";
    target.permission = "denied";
    return "denied";
  }
}

async function ensureIdlePermission(
  target: IdleMagic,
  IdleDetectorCtor: IdleDetectorConstructor | null
): Promise<boolean> {
  await syncIdlePermission(target);

  if (target.permission === "granted") {
    target.error = null;
    return true;
  }

  if (target.permission === "denied") {
    target.error = idlePermissionError("denied");
    return false;
  }

  if (!IdleDetectorCtor) {
    return false;
  }

  const permission = await promptIdlePermission(target, IdleDetectorCtor);
  return permission === "granted";
}

/** Clamps idle thresholds to the browser minimum (1 minute). */
export function normalizeIdleThreshold(threshold = DEFAULT_IDLE_THRESHOLD): number {
  return Math.max(threshold, MIN_IDLE_THRESHOLD);
}

function getWakeLock(): WakeLockLike | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
  return wakeLock ?? null;
}

function getIdleDetectorConstructor(): IdleDetectorConstructor | null {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const ctor = Reflect.get(globalThis, "IdleDetector");
  return typeof ctor === "function" ? (ctor as IdleDetectorConstructor) : null;
}

/** Reads whether the Screen Wake Lock API is available. */
export function isWakeLockSupported(wakeLock: WakeLockLike | null = getWakeLock()): boolean {
  return wakeLock != null && typeof wakeLock.request === "function";
}

/** Reads whether the Idle Detection API is available. */
export function isIdleDetectionSupported(
  IdleDetectorCtor: IdleDetectorConstructor | null = getIdleDetectorConstructor()
): boolean {
  return IdleDetectorCtor != null && typeof IdleDetectorCtor.requestPermission === "function";
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

function registerWakeLockMagic(Alpine: AlpineType.Alpine): void {
  const wakeLock = getWakeLock();
  const supported = isWakeLockSupported(wakeLock);
  let sentinel: WakeLockSentinelLike | null = null;
  let wantsLock = false;

  const state = Alpine.reactive<WakeLockMagic>({
    ...createWakeLockState(supported),

    async request() {
      if (!(supported && wakeLock)) {
        this.error = "Wake Lock is not supported";
        return false;
      }

      if (this.isActive) {
        return true;
      }

      this.isRequesting = true;
      this.error = null;
      wantsLock = true;

      try {
        sentinel = await wakeLock.request("screen");
        this.isActive = !sentinel.released;

        const onRelease = () => {
          this.isActive = false;
          sentinel = null;
        };

        sentinel.addEventListener("release", onRelease);
        return true;
      } catch (error) {
        wantsLock = false;
        this.error = error instanceof Error ? error.message : "Failed to acquire wake lock";
        return false;
      } finally {
        this.isRequesting = false;
      }
    },

    async release() {
      wantsLock = false;

      if (!sentinel || sentinel.released) {
        this.isActive = false;
        sentinel = null;
        return true;
      }

      try {
        await sentinel.release();
        this.isActive = false;
        sentinel = null;
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to release wake lock";
        return false;
      }
    },
  });

  Alpine.magic("wakelock", () => state);

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && wantsLock && !state.isActive) {
        void state.request();
      }
    });
  }
}

function registerIdleMagic(Alpine: AlpineType.Alpine): void {
  const IdleDetectorCtor = getIdleDetectorConstructor();
  const supported = isIdleDetectionSupported(IdleDetectorCtor);
  let detector: IdleDetectorLike | null = null;
  let changeHandler: EventListener | null = null;

  const updateIdleState = (target: IdleMagic, source: IdleDetectorLike) => {
    target.userState = source.userState;
    target.screenState = source.screenState;
  };

  const clearIdleDetector = () => {
    if (detector && changeHandler) {
      detector.removeEventListener("change", changeHandler);
    }

    detector = null;
    changeHandler = null;
  };

  const clearIdleState = (target: IdleMagic) => {
    target.isWatching = false;
    target.userState = null;
    target.screenState = null;
  };

  const beginIdleDetection = async (target: IdleMagic, threshold: number): Promise<boolean> => {
    if (!IdleDetectorCtor) {
      return false;
    }

    const activeDetector = new IdleDetectorCtor();
    const onChange = () => {
      updateIdleState(target, activeDetector);
    };

    activeDetector.addEventListener("change", onChange);
    await activeDetector.start({ threshold });
    detector = activeDetector;
    changeHandler = onChange;
    updateIdleState(target, activeDetector);
    target.isWatching = true;
    return true;
  };

  const ensureIdlePermissionForTarget = (target: IdleMagic) =>
    ensureIdlePermission(target, IdleDetectorCtor);

  const restartIdleIfThresholdChanged = (
    target: IdleMagic,
    options?: { threshold?: number }
  ): boolean => {
    if (!(target.isWatching && detector)) {
      return false;
    }

    const nextThreshold = normalizeIdleThreshold(options?.threshold ?? target.threshold);
    if (options?.threshold === undefined || nextThreshold === target.threshold) {
      return false;
    }

    clearIdleDetector();
    clearIdleState(target);
    return true;
  };

  const startIdleWatching = async (
    target: IdleMagic,
    options?: { threshold?: number }
  ): Promise<boolean> => {
    if (!(supported && IdleDetectorCtor)) {
      target.error = "Idle Detection is not supported";
      return false;
    }

    if (target.isWatching && detector && !restartIdleIfThresholdChanged(target, options)) {
      return true;
    }

    if (!(await ensureIdlePermissionForTarget(target))) {
      return false;
    }

    const threshold = normalizeIdleThreshold(options?.threshold ?? target.threshold);
    target.threshold = threshold;
    target.isLoading = true;
    target.error = null;

    try {
      return await beginIdleDetection(target, threshold);
    } catch (error) {
      clearIdleDetector();
      clearIdleState(target);
      target.error = error instanceof Error ? error.message : "Failed to start idle detection";
      return false;
    } finally {
      target.isLoading = false;
    }
  };

  const state = Alpine.reactive<IdleMagic>({
    ...createIdleState(supported),

    get isActive() {
      return this.userState === "active";
    },

    get isIdle() {
      return this.userState === "idle";
    },

    async requestPermission() {
      if (!(supported && IdleDetectorCtor)) {
        this.error = "Idle Detection is not supported";
        this.permission = "denied";
        return "denied";
      }

      await syncIdlePermission(this);

      if (this.permission === "granted") {
        this.error = null;
        return "granted";
      }

      if (this.permission === "denied") {
        this.error = idlePermissionError("denied");
        return "denied";
      }

      return promptIdlePermission(this, IdleDetectorCtor);
    },

    start(options?: { threshold?: number }) {
      return startIdleWatching(this, options);
    },

    stop() {
      if (!(detector && changeHandler)) {
        this.isWatching = false;
        return false;
      }

      clearIdleDetector();
      clearIdleState(this);
      return true;
    },
  });

  Alpine.magic("idle", () => state);

  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    void navigator.permissions
      .query({ name: IDLE_DETECTION_PERMISSION })
      .then((status) => {
        state.permission = status.state;
        status.addEventListener("change", () => {
          state.permission = status.state;
          if (status.state !== "granted" && state.isWatching) {
            state.stop();
          }
        });
      })
      .catch(() => {
        // Permissions API name unsupported — fall back to requestPermission().
      });
  }
}

/** Alpine.js attention plugin. Registers `$wakelock` and `$idle` magics. */
export default function attentionPlugin(Alpine: AlpineType.Alpine): void {
  registerWakeLockMagic(Alpine);
  registerIdleMagic(Alpine);
}
