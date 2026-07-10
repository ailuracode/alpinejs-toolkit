/**
 * Public entrypoint for `@ailuracode/alpine-attention`.
 *
 * Re-exports only. Implementation lives in `./controller.ts`,
 * the Alpine integration in `./plugin.ts`, and the supporting
 * types in `./types.ts` and `./events.ts`.
 */

// --- Helpers re-exported for consumers / tests ------------------------------
export {
  createIdleState,
  createWakeLockState,
  DEFAULT_IDLE_THRESHOLD,
  isIdleDetectionSupported,
  isWakeLockSupported,
  MIN_IDLE_THRESHOLD,
  normalizeIdleThreshold,
  readIdlePermissionStatus,
} from "./controller.js";
// --- Event surface ----------------------------------------------------------
export type {
  AttentionEvents,
  IdleChangeDetail,
  WakeLockChangeDetail,
} from "./events.js";
// --- Alpine integration -----------------------------------------------------
export { default as attentionPlugin, default } from "./plugin.js";
// --- Public types ------------------------------------------------------------
export type {
  IdleDetectorConstructor,
  IdleDetectorLike,
  IdleMagic,
  IdleScreenState,
  IdleUserState,
  WakeLockLike,
  WakeLockMagic,
  WakeLockSentinelLike,
} from "./types.js";
