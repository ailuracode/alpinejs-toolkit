/**
 * Event map consumed by `BaseController<RealtimeEvents>`.
 *
 * The controller re-emits the same payloads documented in the spec
 * (statuschange / message / error / heartbeat / reconnect /
 * backpressure) but routes them through the toolkit's standard
 * typed emitter so consumers can subscribe with
 * `controller.on('statuschange', state => { ... })` exactly like
 * every other package in the monorepo.
 *
 * @module
 */

/**
 * Detail emitted on the `heartbeat` channel when a pong arrives in
 * time. `latencyMs` is measured between the outbound ping and the
 * inbound pong (or the first inbound message that counts as a
 * pong).
 */
export interface RealtimeHeartbeatDetail {
  readonly latencyMs: number;
}

/**
 * Detail emitted on the `reconnect` channel immediately before a
 * retry attempt. `nextDelayMs` is the exact delay that the
 * {@link ReconnectManager} will honour.
 */
export interface RealtimeReconnectDetail {
  readonly attempt: number;
  readonly nextDelayMs: number;
}

/**
 * Detail emitted on the `backpressure` channel when a channel
 * buffer crosses its `highWaterMark`. `strategy` is always
 * `"drop-newest"` in v0.1.0 — additional strategies land in
 * v0.2.0 once we have user feedback.
 */
export interface RealtimeBackpressureDetail {
  readonly channel: string;
  readonly dropped: number;
  readonly strategy: "drop-newest";
}

/**
 * Discriminated event map for `RealtimeController`.
 *
 * The shape extends the toolkit's standard `Record<string, unknown>`
 * constraint on `BaseController<EventMap>`. Detail payloads are
 * concrete so downstream event listeners get full type inference.
 */
export interface RealtimeEvents extends Record<string, unknown> {
  /** Fires whenever the controller's effective state changes. */
  statuschange: import("./RealtimeControllerState").RealtimeControllerState;
  /** Fires when an inbound message has been parsed and routed. */
  message: import("./RealtimeMessage").RealtimeMessage;
  /** Fires whenever the controller surfaces an error to the consumer. */
  error: import("./RealtimeError").RealtimeError;
  /** Fires when a heartbeat pong arrives in time. */
  heartbeat: RealtimeHeartbeatDetail;
  /** Fires immediately before a retry attempt. */
  reconnect: RealtimeReconnectDetail;
  /** Fires when a channel buffer overflows. */
  backpressure: RealtimeBackpressureDetail;
}
