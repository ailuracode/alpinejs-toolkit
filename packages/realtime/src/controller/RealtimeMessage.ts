/**
 * Message envelope exchanged between a {@link RealtimeTransportAdapter}
 * and the realtime controller. Adapters translate transport-native
 * payloads (SSE `data:`, WebSocket text frames, MQTT topics, etc.)
 * into this shape so the controller can stay adapter-agnostic.
 *
 * @module
 */

/**
 * Message exchanged over a realtime transport.
 *
 * - `channel` — logical topic the message belongs to. REQUIRED
 *   because every channel handler dispatches on this key.
 * - `event`   — semantic event name (e.g. `"message"`, `"presence"`).
 *   Optional; adapters that don't differentiate between events
 *   (e.g. plain WebSocket frames) may leave it `undefined`.
 * - `data`    — adapter-defined payload. Adapters SHOULD keep this
 *   JSON-serializable but typing stays `unknown` because transports
 *   like MQTT or Protobuf deliver binary payloads.
 * - `id`      — monotonically increasing identifier assigned by the
 *   origin adapter. Used for dedupe and last-event-id replay.
 *   Optional; adapters that can't produce one leave it `undefined`.
 * - `timestamp` — epoch milliseconds when the adapter received the
 *   message (NOT when the controller emitted it). Optional.
 */
export interface RealtimeMessage {
  readonly channel: string;
  readonly event?: string;
  readonly data: unknown;
  readonly id?: string | number;
  readonly timestamp?: number;
}

/**
 * Type-safe builder for {@link RealtimeMessage}. Mostly useful for
 * test fixtures and adapter implementations that synthesize
 * messages locally (e.g. SSE `parseSse` helpers or in-memory
 * adapters).
 */
export interface RealtimeMessageInit {
  readonly channel?: string;
  readonly event?: string;
  readonly data: unknown;
  readonly id?: string | number;
  readonly timestamp?: number;
}

/**
 * Subscriber callback invoked when a message arrives on a channel.
 * Return type is `void`; backpressure-aware consumers should use
 * the `'backpressure'` event instead of returning a promise.
 */
export type RealtimeMessageHandler = (message: RealtimeMessage) => void;
