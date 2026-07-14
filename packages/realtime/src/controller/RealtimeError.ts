/**
 * Structured error exposed by the realtime transport controller.
 *
 * `RealtimeError` extends the native `Error` (not `ToolkitError`)
 * because the controller is consumed both by Alpine and by
 * framework-agnostic consumers who don't have `@ailuracode/alpine-core`
 * in their bundle. The `code` is a stable public-API string
 * (see {@link RealtimeErrorCode}) and `retryable` lets the
 * controller's reconnect manager decide whether the error is
 * worth retrying.
 *
 * Use the {@link createTransportError},
 * {@link createParseError}, etc. factories so the
 * `retryable` flag is set correctly per the spec.
 *
 * @module
 */

/**
 * Stable error codes published by the realtime controller. The
 * codes form part of the public API — adding a code is minor,
 * renaming or removing a code is breaking.
 */
export type RealtimeErrorCode =
  | "TRANSPORT_ERROR"
  | "PARSE_ERROR"
  | "HEARTBEAT_TIMEOUT"
  | "MAX_RETRIES_EXCEEDED"
  | "CONFIG_ERROR"
  | "ADAPTER_ERROR"
  | "SEND_UNSUPPORTED";

/**
 * Realtime-specific error. `code` is one of
 * {@link RealtimeErrorCode} and `retryable` mirrors the value set
 * by the factory that built the error.
 *
 * `cause` forwards the underlying transport error (e.g. a
 * `WebSocket` close event, an `EventError`, or a fetch abort)
 * when known.
 */
export class RealtimeError extends Error {
  readonly code: RealtimeErrorCode;
  readonly retryable: boolean;
  readonly cause?: Error;
  readonly timestamp: number;

  constructor(
    message: string,
    code: RealtimeErrorCode,
    options: { retryable?: boolean; cause?: Error } = {}
  ) {
    super(message);
    this.name = "RealtimeError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
    this.timestamp = Date.now();
    // Preserve the prototype chain across transpilers.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Build a transport-level error (`retryable: true`).
 */
export function createTransportError(
  message: string,
  options: { cause?: Error } = {}
): RealtimeError {
  return new RealtimeError(message, "TRANSPORT_ERROR", {
    retryable: true,
    cause: options.cause,
  });
}

/**
 * Build a parse error (`retryable: false`). The controller keeps
 * the transport open on a parse error so a single malformed
 * frame cannot kill an otherwise healthy connection.
 */
export function createParseError(message: string, options: { cause?: Error } = {}): RealtimeError {
  return new RealtimeError(message, "PARSE_ERROR", {
    retryable: false,
    cause: options.cause,
  });
}

/**
 * Build a heartbeat-timeout error (`retryable: true`). The
 * controller triggers a reconnect on this code.
 */
export function createHeartbeatTimeoutError(message = "Heartbeat timed out"): RealtimeError {
  return new RealtimeError(message, "HEARTBEAT_TIMEOUT", {
    retryable: true,
  });
}

/**
 * Build a max-retries-exceeded error (`retryable: false`).
 * Emitted once when the reconnect manager gives up; the
 * controller then transitions to the `failed` state.
 */
export function createMaxRetriesError(
  message = "Maximum retry attempts exceeded",
  options: { attempts?: number } = {}
): RealtimeError {
  const detail = options.attempts !== undefined ? ` after ${options.attempts} attempt(s)` : "";
  return new RealtimeError(`${message}${detail}`, "MAX_RETRIES_EXCEEDED", {
    retryable: false,
  });
}

/**
 * Build a config error (`retryable: false`). Emitted by
 * {@link validateRealtimeControllerConfig} when the config is
 * invalid; consumers can `instanceof RealtimeError` to discriminate.
 */
export function createConfigError(message: string): RealtimeError {
  return new RealtimeError(message, "CONFIG_ERROR", {
    retryable: false,
  });
}

/**
 * Build an adapter error. `retryable` is configurable because
 * adapter-level failures (e.g. a custom adapter's invariant
 * violation) may or may not be recoverable.
 */
export function createAdapterError(
  message: string,
  options: { retryable?: boolean; cause?: Error } = {}
): RealtimeError {
  return new RealtimeError(message, "ADAPTER_ERROR", {
    retryable: options.retryable ?? false,
    cause: options.cause,
  });
}

/**
 * Build a send-unsupported error (`retryable: false`). Emitted
 * by transports that don't support client-to-server messages
 * (SSE) when a consumer calls `publish()`.
 */
export function createSendUnsupportedError(
  message = "Transport does not support client-to-server messages"
): RealtimeError {
  return new RealtimeError(message, "SEND_UNSUPPORTED", {
    retryable: false,
  });
}
