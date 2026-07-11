/**
 * Public entrypoint for `@ailuracode/alpine-attention`.
 *
 * Thin Alpine plugin — registers `$wakelock` and `$idle` magics.
 * Headless controllers and helpers live in `./controller.js`.
 */

export type {
  AttentionEvents,
  IdleChangeDetail,
  IdleEvents,
  WakeLockChangeDetail,
  WakeLockEvents,
} from "./events.js";
export {
  createIdlePermissionAdapter,
  IDLE_PERMISSION_NAME,
} from "./permission-adapter.js";
export { default as attentionPlugin, default } from "./plugin.js";
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
