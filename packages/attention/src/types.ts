/**
 * Public type contracts for `@ailuracode/alpine-attention`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

/** User activity state reported by the Idle Detection API. */
export type IdleUserState = "active" | "idle";

/** Screen lock state reported by the Idle Detection API. */
export type IdleScreenState = "locked" | "unlocked";

/** Minimal shape of a Wake Lock API sentinel. */
export interface WakeLockSentinelLike {
  released: boolean;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  release(): Promise<void>;
}

/** Minimal shape of the Navigator Wake Lock interface. */
export interface WakeLockLike {
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

/** Minimal shape of the Idle Detection API detector. */
export interface IdleDetectorLike {
  userState: IdleUserState;
  screenState: IdleScreenState;
  start(options?: { threshold?: number }): Promise<void>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

/** Constructor shape of the Idle Detection API. */
export interface IdleDetectorConstructor {
  new (): IdleDetectorLike;
  requestPermission(): Promise<PermissionState>;
}

/** Alpine-facing `$wakelock` magic surface. */
export interface WakeLockMagic {
  error: string | null;
  isRequesting: boolean;
  isActive: boolean;
  readonly isSupported: boolean;
  request(): Promise<boolean>;
  release(): Promise<boolean>;
}

/** Alpine-facing `$idle` magic surface. */
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

/** Default idle threshold (60 s). */
export const DEFAULT_IDLE_THRESHOLD = 60_000;

/** Minimum idle threshold enforced by the browser (60 s). */
export const MIN_IDLE_THRESHOLD = 60_000;
