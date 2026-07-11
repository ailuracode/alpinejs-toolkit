/**
 * Strongly-typed event maps for the attention controllers.
 */

import type { IdleScreenState, IdleUserState } from "./types.js";

// ── Detail payloads ──────────────────────────────────────────────

/** Detail payload for wake lock state changes. */
export interface WakeLockChangeDetail {
  readonly isActive: boolean;
  readonly isRequesting: boolean;
  readonly error: string | null;
}

/** Detail payload for idle detection state changes. */
export interface IdleChangeDetail {
  readonly userState: IdleUserState | null;
  readonly screenState: IdleScreenState | null;
  readonly permission: PermissionState | null;
  readonly error: string | null;
  readonly threshold: number;
  readonly isWatching: boolean;
}

// ── Controller event maps ────────────────────────────────────────

/** Events emitted by {@link WakeLockController}. */
export interface WakeLockEvents extends Record<string, unknown> {
  "wakelock:change": WakeLockChangeDetail;
}

/** Events emitted by {@link IdleController}. */
export interface IdleEvents extends Record<string, unknown> {
  "idle:change": IdleChangeDetail;
}

/**
 * Combined event map for {@link AttentionController}.
 * Two keys:
 * - `wakelock:change` — emitted when wake lock is acquired, released, or errors.
 * - `idle:change` — emitted when idle state, screen state, or permission changes.
 */
export interface AttentionEvents extends WakeLockEvents, IdleEvents {}
