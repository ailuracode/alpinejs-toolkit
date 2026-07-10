/**
 * Strongly-typed event map for the attention controller.
 */

/** Detail payload for wake lock state changes. */
export interface WakeLockChangeDetail {
  readonly isActive: boolean;
  readonly isRequesting: boolean;
  readonly error: string | null;
}

/** Detail payload for idle detection state changes. */
export interface IdleChangeDetail {
  readonly userState: import("./types").IdleUserState | null;
  readonly screenState: import("./types").IdleScreenState | null;
  readonly permission: PermissionState | null;
  readonly isWatching: boolean;
}

/**
 * Event map for attention state changes. Two keys:
 * - `wakelock:change` — emitted when wake lock is acquired, released, or errors.
 * - `idle:change` — emitted when idle state, screen state, or permission changes.
 */
export interface AttentionEvents extends Record<string, unknown> {
  "wakelock:change": WakeLockChangeDetail;
  "idle:change": IdleChangeDetail;
}
