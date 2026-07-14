/**
 * Headless entrypoint for `@ailuracode/alpine-attention/controller`.
 *
 * Framework-agnostic controllers, helpers, and the deprecated
 * `registerAttentionMagic` re-export for backward compatibility.
 *
 * @module
 */

import type AlpineType from "alpinejs";
import attentionPlugin from "./plugin";

// ── Headless controllers ─────────────────────────────────────────
export {
  AttentionController,
  createAttentionController,
} from "./attention-controller.js";
export { readIdlePermissionStatus } from "./browser.js";
// ── Events ───────────────────────────────────────────────────────
export type {
  AttentionEvents,
  IdleChangeDetail,
  IdleEvents,
  WakeLockChangeDetail,
  WakeLockEvents,
} from "./events.js";
export {
  createIdleController,
  DEFAULT_IDLE_THRESHOLD,
  IdleController,
  MIN_IDLE_THRESHOLD,
  normalizeIdleThreshold,
} from "./idle-controller.js";
export {
  createIdlePermissionAdapter,
  IDLE_PERMISSION_NAME,
} from "./permission-adapter.js";
// ── Public types ─────────────────────────────────────────────────
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
// ── Helpers ──────────────────────────────────────────────────────
export {
  createIdleState,
  createWakeLockState,
  isIdleDetectionSupported,
  isWakeLockSupported,
} from "./utils.js";
export {
  createWakeLockController,
  WakeLockController,
} from "./wakelock-controller.js";

/**
 * Registers `$wakelock` and `$idle` magics on the given Alpine instance.
 *
 * @deprecated Use the `attentionPlugin` default export from
 * `@ailuracode/alpine-attention` instead.
 */
export function registerAttentionMagic(alpine: AlpineType.Alpine): void {
  attentionPlugin(alpine);
}
