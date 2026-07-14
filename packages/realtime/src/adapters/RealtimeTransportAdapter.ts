/**
 * Transport adapter contract.
 *
 * Adapters bridge the realtime controller with concrete
 * transports (Server-Sent Events, WebSocket, BroadcastChannel,
 * in-memory test adapters, etc.). The interface is
 * intentionally narrow so the controller can stay decoupled
 * from browser / network APIs.
 *
 * Lifecycle:
 *
 * ```text
 *   connect() → 'open' → 'message'* → ('close' | 'error')
 *           ↘ disconnect() (idempotent at any time)
 * ```
 *
 * The adapter IS an `EventTarget` so the controller can use
 * `addEventListener('open' | 'message' | 'close' | 'error', ...)`
 * to wire transport events back into its own state machine.
 *
 * @module
 */

/**
 * Discriminated union of transport-level events fired on the
 * adapter. The controller treats `close` and `error` as
 * reconnect triggers, `open` as a state transition to
 * `"connected"`, and `message` as the RAW frame the
 * controller parses with `config.parse()`.
 */
export type RealtimeAdapterEvent =
  | { readonly type: "open" }
  | { readonly type: "close"; readonly code?: number; readonly reason?: string }
  | { readonly type: "message"; readonly data: string | ArrayBuffer }
  | { readonly type: "error"; readonly message: string; readonly retryable: boolean };

/**
 * Stable readyState of an adapter. Mirrors the WebSocket
 * vocabulary so SSE and WS adapters can share a single state
 * machine.
 */
export type RealtimeAdapterReadyState =
  | "idle"
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "error";

/**
 * Options bag passed to every {@link RealtimeTransportAdapter}.
 * The `endpoint` is the transport URL; `metadata` is a free
 * pass-through for adapter-specific overrides.
 */
export interface TransportAdapterOptions {
  /** Transport URL (SSE endpoint, WebSocket URL, etc.). */
  readonly endpoint: string;
  /** Transport-specific overrides; passed verbatim to adapters. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /**
   * Last event id acknowledged by the controller. Adapters that
   * support replay (EventSource `Last-Event-ID` header, MQTT 5
   * subscription options) MUST honour this when present.
   */
  readonly lastEventId?: string;
}

/**
 * Adapter contract implemented by every transport the
 * controller can drive.
 *
 * Implementations:
 * - MUST be safe to construct in any environment (the
 *   controller probes `isSupported` before invoking
 *   `connect`).
 * - MUST emit `'open'` exactly once after a successful
 *   `connect()`.
 * - MUST emit `'message'` for every inbound frame that the
 *   controller's `parse` understands.
 * - MUST emit `'close'` when the transport closes cleanly and
 *   `'error'` on a transport-level failure. The `retryable`
 *   flag on `'error'` is forwarded to the controller's
 *   reconnect manager.
 * - MUST be safe to call `disconnect()` / `destroy()` more
 *   than once.
 */
export interface RealtimeTransportAdapter {
  /** Stable identifier (e.g. `"sse"`, `"websocket"`, `"memory"`). */
  readonly transportType: "sse" | "websocket" | "broadcastchannel";
  /** Resolved endpoint the adapter is driving. */
  readonly endpoint: string;
  /** Optional transport-specific options. */
  readonly options?: Readonly<Record<string, unknown>>;
  /** Current readyState. */
  readonly readyState: RealtimeAdapterReadyState;

  /**
   * Returns `true` when the underlying transport is available
   * in the current runtime. Probed before `connect()` so
   * adapters can downgrade when the browser disables
   * `EventSource` after a privacy intervention.
   */
  isSupported(): boolean;

  /**
   * Establish the transport connection. MUST resolve only
   * after the adapter has emitted its `'open'` event (or
   * rejected with a transport-level error).
   */
  connect(): Promise<void>;

  /**
   * Send a frame on the transport. Adapters that don't support
   * client-to-server messages (SSE) MUST throw a
   * `RealtimeError` with `code: "SEND_UNSUPPORTED"`.
   */
  send(data: string | ArrayBuffer | Blob): Promise<void>;

  /**
   * Send a heartbeat ping. Adapters that don't differentiate
   * heartbeats from regular frames fall through to `send()`.
   */
  sendHeartbeat(payload?: unknown): Promise<void>;

  /**
   * Close the transport gracefully. Idempotent. The adapter
   * MUST emit `'close'` before this promise resolves.
   */
  disconnect(): Promise<void>;

  /**
   * Release every resource the adapter holds. Idempotent.
   * Called by `RealtimeController.destroy()`; subsequent
   * `connect()` calls MUST throw.
   */
  destroy(): Promise<void> | void;
}
