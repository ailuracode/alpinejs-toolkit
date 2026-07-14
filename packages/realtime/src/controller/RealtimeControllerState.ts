/**
 * Read-only snapshot exposed by the realtime controller via
 * `controller.state` and the spec's
 * `getRealtimeControllerState(controller)` helper.
 *
 * Every field is `readonly` and the object itself is frozen with
 * `Object.freeze` so consumers can't accidentally mutate the
 * controller's internal state. Controllers publish a new frozen
 * object whenever any field changes.
 *
 * @module
 */

/**
 * Lifecycle phase of the realtime controller. The state machine
 * is:
 *
 * ```text
 *   disconnected → connecting → connected
 *                              ↕  paused
 *                              ↕  reconnecting → failed
 * ```
 *
 * `"disconnected"` is the initial state and the state after
 * `disconnect()`. `"failed"` is terminal; consumers must call
 * `connect()` to leave it.
 */
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "paused"
  | "reconnecting"
  | "failed";

/**
 * Stable identifier of the transport the controller is currently
 * bound to. `null` while the controller is `disconnected` or
 * `failed`.
 */
export type RealtimeTransportName = "sse" | "websocket" | "broadcastchannel" | null;

/**
 * Read-only snapshot produced by a realtime controller. Treat
 * this as an immutable value — the controller freezes the
 * object and the `channels` set is also frozen.
 */
export interface RealtimeControllerState {
  /** Current lifecycle phase. */
  readonly status: ConnectionState;
  /** Active transport, or `null` when disconnected. */
  readonly transport: RealtimeTransportName;
  /** Epoch ms when the transport last opened, or `null`. */
  readonly connectedAt: number | null;
  /** Epoch ms when the controller last received a message, or `null`. */
  readonly lastMessageAt: number | null;
  /** Number of consecutive reconnect attempts in the current burst. */
  readonly retryCount: number;
  /** Epoch ms when the next reconnect attempt fires, or `null`. */
  readonly nextRetryAt: number | null;
  /** Active channel names. Frozen; mutating throws in strict mode. */
  readonly channels: ReadonlySet<string>;
  /** Current global buffer size (sum across all channels). */
  readonly bufferedCount: number;
}

interface StateSource {
  readonly status: ConnectionState;
  readonly transport: RealtimeTransportName;
  readonly connectedAt: number | null;
  readonly lastMessageAt: number | null;
  readonly retryCount: number;
  readonly nextRetryAt: number | null;
  readonly channels: ReadonlySet<string>;
  readonly bufferedCount: number;
}

/**
 * Build a deep-readonly snapshot of a controller's internal
 * state. The returned object is `Object.freeze`d and so is its
 * `channels` set, so consumers can hand it to other code without
 * worrying about aliasing.
 */
export function getRealtimeControllerState(source: StateSource): RealtimeControllerState {
  return Object.freeze({
    status: source.status,
    transport: source.transport,
    connectedAt: source.connectedAt,
    lastMessageAt: source.lastMessageAt,
    retryCount: source.retryCount,
    nextRetryAt: source.nextRetryAt,
    channels: Object.freeze(new Set(source.channels)) as ReadonlySet<string>,
    bufferedCount: source.bufferedCount,
  });
}
