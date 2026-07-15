/**
 * Public configuration accepted by the realtime controller.
 *
 * Fields are `readonly` so a config object can be shared across
 * controllers safely. {@link validateRealtimeControllerConfig}
 * normalizes a raw config into a `RealtimeControllerConfig` with
 * every field populated and every value clamped to a safe
 * range.
 *
 * @module
 */

import { createConfigError, type RealtimeError } from "./RealtimeError";
import type { RealtimeMessage, RealtimeMessageHandler } from "./RealtimeMessage";

/**
 * Stable transport selectors the controller understands. The
 * `"auto"` value lets the controller probe WebSocket first and
 * fall back to SSE.
 */
export type RealtimeTransportKind = "sse" | "websocket" | "broadcastchannel" | "auto";

/**
 * Predicate consulted after every recoverable failure. Returning
 * `true` schedules another retry; `false` resolves permanently
 * with a `giveup` event.
 */
export type RealtimeRetryPredicate = (error: RealtimeError) => boolean;

/**
 * Default channel name when a message arrives without an
 * explicit `channel` field. The controller never uses this for
 * `subscribe()` — the channel is the `subscribe()` argument —
 * but it does fill the field on outgoing `publish()` messages.
 */
export const DEFAULT_REALTIME_CHANNEL = "default";

/**
 * Public configuration accepted by the realtime controller. All
 * fields are optional; {@link validateRealtimeControllerConfig}
 * applies defaults and clamps every value to a safe range.
 */
export interface RealtimeControllerConfig {
  /**
   * Identifier used in logs and as the default
   * `Alpine.store` name. Default: `"realtime"`.
   */
  readonly id?: string;

  /**
   * Selector for the transport the controller should drive.
   * When `transport === "auto"`, the controller probes
   * WebSocket first and falls back to SSE. Default: `"auto"`.
   */
  readonly transport?: RealtimeTransportKind;

  /** URL the adapter connects to. Default: `""` (adapter-supplied). */
  readonly endpoint?: string;

  /**
   * Logical channel for `publish()` when a message is sent
   * without an explicit `channel` field. Default: `"default"`.
   */
  readonly defaultChannel?: string;

  // ── Reconnect ───────────────────────────────────────────────

  /** Enable automatic reconnect on transport failure. Default: `true`. */
  readonly reconnect?: boolean;

  /**
   * Maximum number of consecutive reconnect attempts. `Infinity`
   * keeps trying forever. Default: `10`.
   */
  readonly maxRetries?: number;

  /** Base backoff delay (ms). Default: `1000`. Clamped to `>= 1`. */
  readonly baseDelayMs?: number;

  /** Cap applied to the exponential backoff. Default: `30000`. Clamped to `>= 1`. */
  readonly maxDelayMs?: number;

  /**
   * Multiplicative jitter factor. `0` is deterministic; `1` is
   * full jitter. Clamped to `[0, 1]`. Default: `0.2`.
   */
  readonly jitterFactor?: number;

  /**
   * Predicate consulted after each failure. Defaults to
   * `(error) => error.retryable`.
   */
  readonly retryOn?: RealtimeRetryPredicate;

  // ── Heartbeat ───────────────────────────────────────────────

  /**
   * Heartbeat interval (ms). `0` disables outbound pings.
   * Default: `30000`.
   */
  readonly heartbeatIntervalMs?: number;

  /**
   * Maximum time the controller waits for a heartbeat
   * acknowledgement before declaring the transport dead.
   * Default: `10000`.
   */
  readonly heartbeatTimeoutMs?: number;

  /**
   * Payload sent on each heartbeat ping. Default:
   * `{ type: "ping" }`. Adapters that wrap the controller and
   * the underlying transport may serialise this differently.
   */
  readonly heartbeatPayload?: unknown;

  // ── Visibility ──────────────────────────────────────────────

  /**
   * Pause the transport when the browser tab is hidden. Default: `true`.
   */
  readonly pauseOnHidden?: boolean;

  /**
   * Resume the transport when the browser tab becomes visible
   * again. Only effective when the controller is currently
   * `paused`. Default: `true`.
   */
  readonly resumeOnVisible?: boolean;

  // ── Channels & backpressure ─────────────────────────────────

  /**
   * Per-channel buffer cap. When a channel's pending message
   * count crosses this value, new messages are dropped and a
   * `backpressure` event fires. Default: `1000`.
   */
  readonly highWaterMark?: number;

  // ── Parser ──────────────────────────────────────────────────

  /**
   * Decode a raw frame from the adapter into a
   * {@link RealtimeMessage}. Default: `JSON.parse` augmented
   * with the default channel.
   */
  readonly parse?: (data: string | ArrayBuffer) => RealtimeMessage;

  /**
   * Encode a {@link RealtimeMessage} into a raw frame. Default:
   * `JSON.stringify`. The adapter is responsible for sending
   * the raw frame on the transport.
   */
  readonly serialize?: (message: RealtimeMessage) => string | ArrayBuffer;

  // ── Auth ────────────────────────────────────────────────────

  /**
   * Returns auth credentials for transports that need them
   * (e.g. WebSocket subprotocols, SSE query strings). The
   * controller calls the provider before each `connect()`.
   */
  readonly authProvider?: () => Promise<Record<string, string> | string>;

  // ── Dependency injection (advanced) ─────────────────────────

  /**
   * Adapter to drive. When `undefined`, the controller
   * lazily creates one based on `transport` (Phase 3). For
   * tests, callers pass an in-memory mock here.
   */
  readonly adapter?: import("../adapters").RealtimeTransportAdapter;

  /**
   * Override the default `setTimeout` / `clearTimeout`. Tests
   * use fake timers; production code does not set this.
   */
  readonly timers?: {
    readonly setTimeout: (handler: () => void, delayMs: number) => number;
    readonly clearTimeout: (handle: number) => void;
    readonly setInterval: (handler: () => void, intervalMs: number) => number;
    readonly clearInterval: (handle: number) => void;
  };

  /**
   * Override the random source used by the backoff calculator.
   * Tests pass a deterministic value; production code does
   * not set this.
   */
  readonly random?: () => number;

  // ── Alpine integration ─────────────────────────────────────

  /**
   * `$realtime` magic key the Alpine plugin registers under.
   * Defaults to `"realtime"`. Set when the host already owns a
   * `realtime` magic or another toolkit plugin would collide on
   * that name — the rename avoids the collision without touching
   * the controller or transport adapter.
   */
  readonly magicKey?: string;
}

/**
 * A {@link RealtimeControllerConfig} whose optional fields are
 * all populated and whose numeric values are clamped to safe
 * ranges. The controller works exclusively with normalized
 * configs.
 */
export interface NormalizedRealtimeControllerConfig {
  readonly id: string;
  readonly transport: RealtimeTransportKind;
  readonly endpoint: string;
  readonly defaultChannel: string;
  readonly reconnect: boolean;
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitterFactor: number;
  readonly retryOn: RealtimeRetryPredicate;
  readonly heartbeatIntervalMs: number;
  readonly heartbeatTimeoutMs: number;
  readonly heartbeatPayload: unknown;
  readonly pauseOnHidden: boolean;
  readonly resumeOnVisible: boolean;
  readonly highWaterMark: number;
  readonly parse: (data: string | ArrayBuffer) => RealtimeMessage;
  readonly serialize: (message: RealtimeMessage) => string | ArrayBuffer;
  readonly authProvider: (() => Promise<Record<string, string> | string>) | undefined;
  readonly adapter: import("../adapters").RealtimeTransportAdapter | null;
  readonly timers: NormalizedTimers;
  readonly random: () => number;
}

interface NormalizedTimers {
  readonly setTimeout: (handler: () => void, delayMs: number) => number;
  readonly clearTimeout: (handle: number) => void;
  readonly setInterval: (handler: () => void, intervalMs: number) => number;
  readonly clearInterval: (handle: number) => void;
}

const DEFAULT_HEARTBEAT_PAYLOAD: { type: "ping" } = Object.freeze({ type: "ping" });

function defaultParse(data: string | ArrayBuffer): RealtimeMessage {
  const text = typeof data === "string" ? data : new TextDecoder().decode(data);
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (parsed === null || typeof parsed !== "object") {
    throw new TypeError("parse() expected a JSON object");
  }
  const channelValue = parsed.channel;
  if (typeof channelValue !== "string") {
    throw new TypeError("parse() expected a `channel` string field");
  }
  return {
    channel: channelValue,
    event: typeof parsed.event === "string" ? (parsed.event as string) : undefined,
    data: parsed.data,
    id:
      typeof parsed.id === "string" || typeof parsed.id === "number"
        ? (parsed.id as string | number)
        : undefined,
    timestamp: typeof parsed.timestamp === "number" ? (parsed.timestamp as number) : Date.now(),
  };
}

function defaultSerialize(message: RealtimeMessage): string {
  return JSON.stringify({
    channel: message.channel,
    event: message.event,
    data: message.data,
    id: message.id,
    timestamp: message.timestamp ?? Date.now(),
  });
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function clampJitter(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.2;
  }
  return Math.min(1, Math.max(0, value));
}

/**
 * Validate and normalize a raw {@link RealtimeControllerConfig}.
 *
 * - Missing optional fields receive documented defaults.
 * - Numeric fields are clamped to safe ranges (`jitterFactor` to
 *   `[0, 1]`, `maxRetries` to `max(0, floor(n))`, all delay /
 *   interval values to `>= 1`).
 * - Invalid types throw a {@link RealtimeError} with
 *   `code: "CONFIG_ERROR"`.
 */
export function validateRealtimeControllerConfig(
  config: RealtimeControllerConfig = {}
): NormalizedRealtimeControllerConfig {
  if (config === null || typeof config !== "object") {
    throw createConfigError("RealtimeControllerConfig must be an object");
  }

  const transport = resolveTransport(config.transport);
  const endpoint = resolveString(config.endpoint, "");
  const defaultChannel = resolveString(config.defaultChannel, DEFAULT_REALTIME_CHANNEL);
  const id = resolveString(config.id, "realtime");

  const reconnect = config.reconnect !== false;
  const maxRetries = Math.max(0, Math.floor(config.maxRetries ?? 10));
  const baseDelayMs = clampNumber(
    resolveNumber(config.baseDelayMs, 1000),
    1,
    Number.MAX_SAFE_INTEGER,
    1000
  );
  const maxDelayMs = clampNumber(
    resolveNumber(config.maxDelayMs, 30_000),
    1,
    Number.MAX_SAFE_INTEGER,
    30_000
  );
  const jitterFactor = clampJitter(resolveNumber(config.jitterFactor, 0.2));
  const retryOn = resolveRetryOn(config.retryOn);
  const heartbeatIntervalMs = clampNumber(
    resolveNumber(config.heartbeatIntervalMs, 30_000),
    0,
    Number.MAX_SAFE_INTEGER,
    30_000
  );
  const heartbeatTimeoutMs = clampNumber(
    resolveNumber(config.heartbeatTimeoutMs, 10_000),
    1,
    Number.MAX_SAFE_INTEGER,
    10_000
  );
  const heartbeatPayload =
    config.heartbeatPayload !== undefined ? config.heartbeatPayload : DEFAULT_HEARTBEAT_PAYLOAD;
  const pauseOnHidden = config.pauseOnHidden !== false;
  const resumeOnVisible = config.resumeOnVisible !== false;
  const highWaterMark = Math.max(0, Math.floor(resolveNumber(config.highWaterMark, 1000)));
  const parse = typeof config.parse === "function" ? config.parse : defaultParse;
  const serialize = makeSerialize(config.serialize);
  const authProvider = typeof config.authProvider === "function" ? config.authProvider : undefined;
  const adapter = config.adapter ?? null;
  const timers = resolveTimers(config.timers);
  const random = typeof config.random === "function" ? config.random : Math.random;

  return {
    id,
    transport,
    endpoint,
    defaultChannel,
    reconnect,
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    jitterFactor,
    retryOn,
    heartbeatIntervalMs,
    heartbeatTimeoutMs,
    heartbeatPayload,
    pauseOnHidden,
    resumeOnVisible,
    highWaterMark,
    parse,
    serialize,
    authProvider,
    adapter,
    timers,
    random,
  };
}

function resolveTransport(value: unknown): RealtimeTransportKind {
  const transport = (value ?? "auto") as RealtimeTransportKind;
  if (
    transport !== "sse" &&
    transport !== "websocket" &&
    transport !== "broadcastchannel" &&
    transport !== "auto"
  ) {
    throw createConfigError(
      `RealtimeControllerConfig.transport must be "sse" | "websocket" | "broadcastchannel" | "auto" (got ${JSON.stringify(transport)})`
    );
  }
  return transport;
}

function resolveString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function resolveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function resolveRetryOn(value: RealtimeControllerConfig["retryOn"]): RealtimeRetryPredicate {
  if (typeof value !== "function") {
    return (error: RealtimeError) => error.retryable;
  }
  return (error: RealtimeError) => Boolean(value(error));
}

function makeSerialize(
  value: RealtimeControllerConfig["serialize"]
): (message: RealtimeMessage) => string | ArrayBuffer {
  if (typeof value === "function") {
    return (message) => value(message);
  }
  return defaultSerialize;
}

function resolveTimers(value: RealtimeControllerConfig["timers"]): NormalizedTimers {
  const globalTimers = globalThis as {
    setTimeout: NormalizedTimers["setTimeout"];
    clearTimeout: NormalizedTimers["clearTimeout"];
    setInterval: NormalizedTimers["setInterval"];
    clearInterval: NormalizedTimers["clearInterval"];
  };
  return {
    setTimeout: value?.setTimeout ?? globalTimers.setTimeout.bind(globalTimers),
    clearTimeout: value?.clearTimeout ?? globalTimers.clearTimeout.bind(globalTimers),
    setInterval: value?.setInterval ?? globalTimers.setInterval.bind(globalTimers),
    clearInterval: value?.clearInterval ?? globalTimers.clearInterval.bind(globalTimers),
  };
}

/**
 * Type guard: `true` when `value` is a {@link RealtimeMessage}.
 * Useful for adapters that synthesise messages and want runtime
 * validation before they hand the envelope to a controller.
 */
export function isRealtimeMessage(value: unknown): value is RealtimeMessage {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<RealtimeMessage>;
  return (
    typeof candidate.channel === "string" &&
    (candidate.event === undefined || typeof candidate.event === "string") &&
    "data" in candidate
  );
}

/**
 * Type guard: `true` when `value` is a
 * {@link RealtimeMessageHandler}. Used by adapters to validate
 * the handler argument before storing it in their channel set.
 */
export function isRealtimeMessageHandler(value: unknown): value is RealtimeMessageHandler {
  return typeof value === "function";
}
