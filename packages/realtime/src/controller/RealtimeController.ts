/**
 * RealtimeController — headless transport controller.
 *
 * Owns connection lifecycle, channels, reconnect, heartbeat, and
 * visibility-aware suspension. Extends `BaseController` from
 * `@ailuracode/alpine-core` for typed events, lifecycle, and
 * cleanup, and composes a private `EventTarget` so adapters
 * (which are themselves `EventTarget`s) can be wired in
 * uniformly.
 *
 * The controller has zero constructor side effects: no timers,
 * no listeners, no DOM access. All work happens in
 * {@link RealtimeController.connect}.
 *
 * @module
 */

import { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core/controller";

import type { RealtimeTransportAdapter } from "../adapters/RealtimeTransportAdapter";
import { HeartbeatManager } from "../utils/heartbeat";
import { VisibilityManager } from "../utils/visibility";
import {
  type NormalizedRealtimeControllerConfig,
  validateRealtimeControllerConfig,
} from "./RealtimeControllerConfig";
import {
  type ConnectionState,
  getRealtimeControllerState,
  type RealtimeControllerState,
  type RealtimeTransportName,
} from "./RealtimeControllerState";
import {
  createAdapterError,
  createHeartbeatTimeoutError,
  createMaxRetriesError,
  createParseError,
  createTransportError,
  RealtimeError,
} from "./RealtimeError";
import type { RealtimeEvents } from "./RealtimeEvents";
import type { RealtimeMessage, RealtimeMessageHandler } from "./RealtimeMessage";

/**
 * State machine transition for {@link RealtimeController}.
 *
 * Allows/disallows transitions:
 *
 * ```text
 *   disconnected → connecting
 *   connecting   → connected | failed | disconnected
 *   connected    → paused | reconnecting | disconnected
 *   paused       → connecting | disconnected
 *   reconnecting → connecting | failed | disconnected
 *   failed       → connecting | disconnected
 * ```
 */
const ALLOWED_TRANSITIONS: Readonly<Record<ConnectionState, ReadonlySet<ConnectionState>>> = {
  disconnected: new Set<ConnectionState>(["connecting"]),
  connecting: new Set<ConnectionState>(["connected", "failed", "disconnected"]),
  connected: new Set<ConnectionState>(["paused", "reconnecting", "failed", "disconnected"]),
  paused: new Set<ConnectionState>(["connecting", "failed", "disconnected"]),
  reconnecting: new Set<ConnectionState>(["connecting", "failed", "disconnected"]),
  failed: new Set<ConnectionState>(["connecting", "disconnected"]),
};

interface ChannelBuffer {
  readonly handlers: Set<RealtimeMessageHandler>;
  queue: RealtimeMessage[];
  buffered: number;
}

interface ScheduledReconnect {
  /** AbortController for the scheduled retry, if any. */
  controller: AbortController | null;
  /** The most recently computed attempt number. */
  attempt: number;
  /** Epoch ms when the next attempt will fire, or `null`. */
  nextRetryAt: number | null;
}

/**
 * Headless transport controller.
 *
 * Consumers subscribe to typed events via `controller.on(...)`
 * (inherited from `BaseController`) or `controller.addEventListener(...)`
 * for the DOM-style API.
 *
 * The controller's phase (`idle` / `mounted` / `destroyed`,
 * inherited from `BaseController`) tracks toolkit lifecycle;
 * the realtime connection state lives in
 * {@link RealtimeControllerState.status} and is exposed through
 * the `state` getter and the `'statuschange'` event.
 */
export class RealtimeController extends BaseController<RealtimeEvents> {
  readonly #config: NormalizedRealtimeControllerConfig;
  /** Adapter currently driving the controller (set by `setAdapter`). */
  #adapter: RealtimeTransportAdapter | null;
  /** Adapter bound listeners (kept for cleanup). */
  #boundListeners: {
    open: (event: Event) => void;
    message: (event: Event) => void;
    close: (event: Event) => void;
    error: (event: Event) => void;
  } | null = null;

  /** Active channels keyed by name. */
  readonly #channels: Map<string, ChannelBuffer> = new Map();
  /** Pending channel buffer drains, debounced per microtask. */
  #pendingDrain: Promise<void> | null = null;
  /** Global buffered count (sum across channels). */
  #bufferedCount = 0;
  /** Current lifecycle phase. */
  #status: ConnectionState = "disconnected";
  /** Active transport, or `null`. */
  #transport: RealtimeTransportName = null;
  /** Epoch ms when the transport last opened. */
  #connectedAt: number | null = null;
  /** Epoch ms when the controller last received a message. */
  #lastMessageAt: number | null = null;
  /** Number of consecutive retry attempts. */
  #retryCount = 0;
  /** Most recent scheduled reconnect. */
  #scheduledReconnect: ScheduledReconnect = {
    controller: null,
    attempt: 0,
    nextRetryAt: null,
  };
  /** Heartbeat manager. */
  readonly #heartbeat: HeartbeatLike;
  /** Reconnect manager. */
  readonly #reconnect: ReconnectLike;
  /** Visibility manager. */
  readonly #visibility: VisibilityLike;
  /** True when `destroy()` has been called. */
  #destroyed = false;

  constructor(config?: import("./RealtimeControllerConfig").RealtimeControllerConfig) {
    super(config?.id ?? generateId("realtime"));
    this.#config = validateRealtimeControllerConfig(config);
    this.#adapter = this.#config.adapter;

    const timers = this.#config.timers;
    this.#heartbeat = createHeartbeatAdapter(timers);
    this.#reconnect = createReconnectAdapter(timers, this.#config.random);
    this.#visibility = createVisibilityAdapter();

    // No side effects: the constructor does not touch DOM, timers,
    // or transport. `connect()` is the only entry point that wires
    // up listeners.
  }

  // ── Public state surface ──────────────────────────────────────

  /** Normalized configuration. Frozen via `validate`. */
  get config(): Readonly<NormalizedRealtimeControllerConfig> {
    return this.#config;
  }

  /** Read-only snapshot of the controller's current state. */
  get state(): RealtimeControllerState {
    return this.#snapshotState();
  }

  /** Currently bound adapter, or `null` when disconnected. */
  getAdapter(): RealtimeTransportAdapter | null {
    return this.#adapter;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Establish the transport. Idempotent: a second call while
   * already connecting / connected is a no-op.
   */
  async connect(): Promise<void> {
    this.#assertAlive();
    if (this.#status === "connecting" || this.#status === "connected") {
      return;
    }
    if (this.#status === "failed") {
      this.#retryCount = 0;
      this.#scheduledReconnect = { controller: null, attempt: 0, nextRetryAt: null };
    }

    if (!this.#adapter) {
      const reason =
        "No adapter bound; call setAdapter() or pass `config.adapter` before connect().";
      this.#fail(createAdapterError(reason, { retryable: false }));
      return;
    }

    this.#transitionTo("connecting");
    try {
      await this.#adapter.connect();
    } catch (cause) {
      const error =
        cause instanceof Error
          ? createTransportError(cause.message, { cause })
          : createTransportError("Adapter connect() rejected");
      this.#handleTransportFailure(error);
      return;
    }

    this.#onTransportOpen();
  }

  /**
   * Close the transport and stop the reconnect loop. Idempotent.
   * Leaves the controller reusable — a subsequent `connect()`
   * opens a fresh transport.
   */
  async disconnect(): Promise<void> {
    this.#assertAlive();
    if (this.#status === "disconnected") {
      return;
    }

    this.#cancelScheduledReconnect();
    this.#heartbeat.stop();
    this.#visibility.stop();
    this.#retryCount = 0;

    if (this.#adapter) {
      try {
        await this.#adapter.disconnect();
      } catch {
        /* swallow — disconnect is best-effort */
      }
    }

    this.#transitionTo("disconnected");
  }

  /**
   * Suspend the transport. Stops the heartbeat and visibility
   * listeners. If the transport supports pause, the controller
   * calls `disconnect()` on the adapter to release the socket;
   * otherwise the adapter stays open and the controller simply
   * ignores inbound messages.
   */
  async pause(): Promise<void> {
    this.#assertAlive();
    if (this.#status !== "connected") {
      return;
    }

    this.#heartbeat.stop();
    this.#cancelScheduledReconnect();

    if (this.#adapter) {
      try {
        await this.#adapter.disconnect();
      } catch {
        /* swallow — pause is best-effort */
      }
    }

    this.#transitionTo("paused");
  }

  /**
   * Resume a paused controller. Re-opens the transport and
   * restarts the heartbeat. No-op if not paused.
   */
  async resume(): Promise<void> {
    this.#assertAlive();
    if (this.#status !== "paused") {
      return;
    }

    this.#transitionTo("connecting");
    try {
      if (this.#adapter) {
        await this.#adapter.connect();
      }
    } catch (cause) {
      const error =
        cause instanceof Error
          ? createTransportError(cause.message, { cause })
          : createTransportError("Adapter connect() rejected during resume()");
      this.#handleTransportFailure(error);
      return;
    }
    this.#onTransportOpen();
  }

  /**
   * Release every resource the controller owns: timers, listeners,
   * transport, channels. Idempotent.
   *
   * Calls `super.destroy()` synchronously at the start so that
   * `controller.isDestroyed` flips to `true` before any awaited
   * teardown completes — callers that ignore the returned
   * promise (e.g. `Alpine.cleanup`) still observe a deterministic
   * "destroyed" lifecycle phase.
   */
  override async destroy(): Promise<void> {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;

    // Synchronous teardown first — listeners, timers, channels —
    // so `isDestroyed` is observable before async work begins.
    super.destroy();
    this.#cancelScheduledReconnect();
    this.#heartbeat.stop();
    this.#visibility.stop();
    this.#unbindAdapterListeners();

    if (this.#adapter) {
      try {
        await this.#adapter.disconnect();
      } catch {
        /* swallow */
      }
      try {
        await Promise.resolve(this.#adapter.destroy());
      } catch {
        /* swallow */
      }
      this.#adapter = null;
    }

    // Drop all channels and their handlers.
    for (const channel of this.#channels.values()) {
      channel.handlers.clear();
      channel.queue = [];
    }
    this.#channels.clear();
    this.#bufferedCount = 0;

    this.#status = "disconnected";
    this.#transport = null;
  }

  // ── Channel API ──────────────────────────────────────────────

  /**
   * Subscribe to messages on a channel. Returns an
   * idempotent unsubscribe function.
   */
  subscribe(channel: string, handler: RealtimeMessageHandler): () => void {
    this.#assertAlive();
    if (typeof channel !== "string" || channel.length === 0) {
      throw new ToolkitError(
        "RealtimeController.subscribe: channel must be a non-empty string",
        "TOOLKIT_INVALID_STATE"
      );
    }
    if (typeof handler !== "function") {
      throw new ToolkitError(
        "RealtimeController.subscribe: handler must be a function",
        "TOOLKIT_INVALID_STATE"
      );
    }

    let buffer = this.#channels.get(channel);
    if (!buffer) {
      buffer = { handlers: new Set(), queue: [], buffered: 0 };
      this.#channels.set(channel, buffer);
    }
    buffer.handlers.add(handler);

    return () => {
      this.unsubscribe(channel, handler);
    };
  }

  /**
   * Remove a handler from a channel. When no handler is
   * supplied, the channel is dropped entirely. No-op if the
   * channel doesn't exist.
   */
  unsubscribe(channel: string, handler?: RealtimeMessageHandler): void {
    const buffer = this.#channels.get(channel);
    if (!buffer) {
      return;
    }
    if (handler) {
      buffer.handlers.delete(handler);
    } else {
      buffer.handlers.clear();
    }
    if (buffer.handlers.size === 0) {
      this.#bufferedCount = Math.max(0, this.#bufferedCount - buffer.buffered);
      buffer.queue = [];
      buffer.buffered = 0;
      this.#channels.delete(channel);
    }
  }

  /**
   * Publish a message to a channel. The message is serialised
   * with `config.serialize` and sent on the adapter. Adapters
   * that don't support client-to-server messages (SSE) reject
   * with `SEND_UNSUPPORTED`.
   */
  async publish(channel: string, message: RealtimeMessage): Promise<void> {
    this.#assertAlive();
    this.#assertCanPublish();

    const enriched = this.#enrichOutbound(channel, message);
    const raw = this.#serializeOrThrow(enriched);
    await this.#sendOrThrow(raw);
  }

  #assertCanPublish(): void {
    if (this.#status !== "connected" && this.#status !== "paused") {
      throw new ToolkitError(
        `RealtimeController.publish: controller is ${this.#status}; connect() first`,
        "TOOLKIT_INVALID_STATE"
      );
    }
    if (!this.#adapter) {
      throw new ToolkitError(
        "RealtimeController.publish: no adapter bound",
        "TOOLKIT_INVALID_STATE"
      );
    }
  }

  #enrichOutbound(channel: string, message: RealtimeMessage): RealtimeMessage {
    return {
      ...message,
      channel: message.channel ?? channel ?? this.#config.defaultChannel,
      timestamp: message.timestamp ?? Date.now(),
    };
  }

  #serializeOrThrow(message: RealtimeMessage): string | ArrayBuffer {
    try {
      return this.#config.serialize(message);
    } catch (cause) {
      const error = createParseError("Failed to serialise outbound message", {
        cause: cause instanceof Error ? cause : new Error(String(cause)),
      });
      this.#emitError(error);
      throw error;
    }
  }

  async #sendOrThrow(raw: string | ArrayBuffer): Promise<void> {
    const adapter = this.#adapter;
    if (!adapter) {
      throw new ToolkitError(
        "RealtimeController.publish: adapter went away",
        "TOOLKIT_INVALID_STATE"
      );
    }
    try {
      await adapter.send(raw);
      return;
    } catch (cause) {
      const error = toSendError(cause);
      if (error.code === "SEND_UNSUPPORTED") {
        this.#emitError(error);
        throw error;
      }
      this.#handleTransportFailure(error);
      throw error;
    }
  }

  // ── Adapter seam ─────────────────────────────────────────────

  /**
   * Bind a new adapter at runtime. If the controller is
   * currently connected, the existing adapter is disconnected
   * and the new one is opened. The new adapter's
   * `transportType` is mirrored into the controller state.
   */
  async setAdapter(adapter: RealtimeTransportAdapter): Promise<void> {
    this.#assertAlive();
    if (!adapter) {
      throw new ToolkitError(
        "RealtimeController.setAdapter: adapter is required",
        "TOOLKIT_INVALID_STATE"
      );
    }

    const wasConnected = this.#status === "connected" || this.#status === "connecting";

    this.#unbindAdapterListeners();
    if (this.#adapter && wasConnected) {
      try {
        await this.#adapter.disconnect();
      } catch {
        /* swallow */
      }
    }

    this.#adapter = adapter;
    this.#transport = adapter.transportType;

    if (wasConnected) {
      await this.connect();
    }
  }

  // ── Private: transport event handlers ────────────────────────

  #onTransportOpen(): void {
    this.#transport = this.#adapter?.transportType ?? null;
    this.#connectedAt = Date.now();
    this.#scheduledReconnect = { controller: null, attempt: 0, nextRetryAt: null };
    this.#transitionTo("connected");

    this.#bindAdapterListeners();

    if (this.#config.heartbeatIntervalMs > 0) {
      this.#heartbeat.start(
        () => this.#sendHeartbeat(),
        () => this.#handleHeartbeatTimeout(),
        this.#config.heartbeatIntervalMs,
        this.#config.heartbeatTimeoutMs
      );
    }

    this.#visibility.start(
      () => {
        if (this.#config.pauseOnHidden && this.#status === "connected") {
          void this.pause();
        }
      },
      () => {
        if (this.#config.resumeOnVisible && this.#status === "paused") {
          void this.resume();
        }
      }
    );
  }

  #onAdapterMessage(rawData: string | ArrayBuffer): void {
    let message: RealtimeMessage;
    try {
      message = this.#config.parse(rawData);
    } catch (cause) {
      const error = createParseError("Failed to parse inbound message", {
        cause: cause instanceof Error ? cause : undefined,
      });
      this.#emitError(error);
      return;
    }

    this.#lastMessageAt = message.timestamp ?? Date.now();
    this.#heartbeat.recordPong();

    const channelName = message.channel;
    if (!channelName || typeof channelName !== "string") {
      const error = createParseError("Inbound message missing `channel`");
      this.#emitError(error);
      return;
    }

    const buffer = this.#channels.get(channelName);
    if (!buffer || buffer.handlers.size === 0) {
      return;
    }

    if (buffer.buffered >= this.#config.highWaterMark) {
      this.#emit("backpressure", {
        channel: channelName,
        dropped: 1,
        strategy: "drop-newest",
      });
      return;
    }

    buffer.queue.push(message);
    buffer.buffered += 1;
    this.#bufferedCount += 1;
    this.#scheduleDrain();

    this.#emit("message", message);
  }

  #onAdapterClose(event: CloseEventLike | undefined): void {
    if (this.#status === "disconnected" || this.#status === "paused") {
      return;
    }
    const message =
      event?.reason ||
      (event?.code !== undefined ? `Transport closed with code ${event.code}` : "Transport closed");
    const error = createTransportError(message, {
      cause: event?.cause,
    });
    this.#handleTransportFailure(error);
  }

  #onAdapterError(event: TransportErrorEvent | Error | undefined): void {
    const message =
      event instanceof Error
        ? event.message
        : event && "message" in event && typeof event.message === "string"
          ? event.message
          : "Transport emitted an error event";
    const retryable = event && "retryable" in event ? Boolean(event.retryable) : true;
    const error = createTransportError(message, {
      cause: event instanceof Error ? event : undefined,
    });
    this.#handleTransportFailure(error, retryable);
  }

  #bindAdapterListeners(): void {
    if (!this.#adapter || this.#boundListeners) {
      return;
    }
    const listener = (_type: string, _detail: unknown): void => {
      // Adapters dispatch native EventTarget events; the controller
      // listens on the adapter's own EventTarget via addEventListener
      // (which is part of the `EventTarget` global). We must use the
      // adapter as the target; some test adapters pass plain objects
      // with an `addEventListener` method, so we guard for that.
    };
    void listener;

    const adapter = this.#adapter;
    const adapterTarget = adapter as unknown as AdapterEventTarget;

    const onOpen = (): void => {
      // Already handled in connect()/onTransportOpen(); the adapter
      // also dispatches this event for any code listening on the
      // controller itself, so re-emit it for symmetry.
      this.#emit("statuschange", this.#snapshotState());
    };

    const onMessage = (event: Event): void => {
      const detail = extractDetail(event);
      if (typeof detail === "string" || detail instanceof ArrayBuffer) {
        this.#onAdapterMessage(detail);
        return;
      }
      const error = createParseError(
        "Adapter emitted a message event with an unexpected payload shape"
      );
      this.#emitError(error);
    };

    const onClose = (event: Event): void => {
      const detail = extractDetail(event);
      const closeDetail =
        detail && typeof detail === "object"
          ? (detail as { code?: number; reason?: string })
          : undefined;
      this.#onAdapterClose(closeDetail);
    };

    const onError = (event: Event): void => {
      const detail = extractDetail(event);
      const errorDetail =
        detail && typeof detail === "object"
          ? (detail as { message?: string; retryable?: boolean })
          : undefined;
      this.#onAdapterError(errorDetail);
    };

    if (typeof adapterTarget.addEventListener === "function") {
      adapterTarget.addEventListener("open", onOpen);
      adapterTarget.addEventListener("message", onMessage);
      adapterTarget.addEventListener("close", onClose);
      adapterTarget.addEventListener("error", onError);
    }

    this.#boundListeners = { open: onOpen, message: onMessage, close: onClose, error: onError };
  }

  #unbindAdapterListeners(): void {
    if (!(this.#boundListeners && this.#adapter)) {
      this.#boundListeners = null;
      return;
    }
    const target = this.#adapter as unknown as AdapterEventTarget;
    if (typeof target.removeEventListener === "function") {
      target.removeEventListener("open", this.#boundListeners.open);
      target.removeEventListener("message", this.#boundListeners.message);
      target.removeEventListener("close", this.#boundListeners.close);
      target.removeEventListener("error", this.#boundListeners.error);
    }
    this.#boundListeners = null;
  }

  // ── Private: reconnect / failure ─────────────────────────────

  #handleTransportFailure(error: RealtimeError, retryableHint?: boolean): void {
    const retryable = retryableHint ?? error.retryable;
    const candidate = new RealtimeError(error.message, error.code, {
      retryable,
      cause: error.cause,
    });
    // The candidate's `timestamp` is set by the constructor to
    // `Date.now()` at the moment of the failure-handling
    // decision; we don't need to preserve the original.
    this.#emitError(candidate);

    if (this.#status === "disconnected" || this.#status === "paused") {
      return;
    }

    if (
      !(this.#config.reconnect && retryable) ||
      this.#retryCount >= this.#config.maxRetries ||
      !this.#config.retryOn(candidate)
    ) {
      this.#fail(candidate);
      return;
    }

    this.#scheduleReconnect(candidate);
  }

  #scheduleReconnect(_error: RealtimeError): void {
    this.#transitionTo("reconnecting");
    this.#cancelScheduledReconnect();

    // Increment the retry counter at schedule time so consumers
    // see a stable `retryCount` in the state snapshot during
    // the backoff window. `connect()` resets it on success.
    this.#retryCount += 1;
    const attempt = this.#retryCount - 1;
    const nextDelayMs = computeBackoffDelay(
      attempt,
      this.#config.baseDelayMs,
      this.#config.maxDelayMs,
      this.#config.jitterFactor,
      this.#config.random
    );

    const controller = new AbortController();
    this.#scheduledReconnect = {
      controller,
      attempt,
      nextRetryAt: Date.now() + nextDelayMs,
    };

    this.#emit("reconnect", { attempt, nextDelayMs });

    this.#config.timers.setTimeout(() => {
      if (controller.signal.aborted || this.#destroyed) {
        return;
      }
      void this.connect();
    }, nextDelayMs);

    controller.signal.addEventListener("abort", () => {
      /* noop — controller state already updated */
    });
  }

  #cancelScheduledReconnect(): void {
    this.#scheduledReconnect.controller?.abort();
    this.#scheduledReconnect = { controller: null, attempt: 0, nextRetryAt: null };
  }

  #fail(error: RealtimeError): void {
    this.#cancelScheduledReconnect();
    this.#heartbeat.stop();
    this.#unbindAdapterListeners();

    if (this.#adapter) {
      void Promise.resolve(this.#adapter.disconnect()).catch(() => undefined);
    }

    const maxRetries = createMaxRetriesError(undefined, {
      attempts: this.#retryCount,
    });
    // Forward the underlying error first, then the
    // MAX_RETRIES_EXCEEDED marker. We always emit both so
    // consumers can rely on the marker regardless of the
    // current connection phase.
    if (error.code !== "MAX_RETRIES_EXCEEDED") {
      this.#emitError(error);
    }
    this.#emitError(maxRetries);

    this.#transitionTo("failed");
  }

  // ── Private: heartbeat ───────────────────────────────────────

  async #sendHeartbeat(): Promise<void> {
    if (!this.#adapter) {
      return;
    }
    try {
      await this.#adapter.sendHeartbeat(this.#config.heartbeatPayload);
    } catch (cause) {
      const error = createTransportError(
        cause instanceof Error ? cause.message : "Heartbeat send() failed",
        { cause: cause instanceof Error ? cause : undefined }
      );
      this.#handleTransportFailure(error);
    }
  }

  #handleHeartbeatTimeout(): void {
    const error = createHeartbeatTimeoutError();
    this.#handleTransportFailure(error);
  }

  // ── Private: channels & backpressure ────────────────────────

  #scheduleDrain(): void {
    if (this.#pendingDrain) {
      return;
    }
    this.#pendingDrain = Promise.resolve().then(() => {
      this.#pendingDrain = null;
      this.#drainChannels();
    });
  }

  #drainChannels(): void {
    for (const [, buffer] of this.#channels) {
      if (buffer.queue.length === 0) {
        continue;
      }
      const batch = buffer.queue;
      buffer.queue = [];
      const drained = batch.length;
      buffer.buffered = Math.max(0, buffer.buffered - drained);
      this.#bufferedCount = Math.max(0, this.#bufferedCount - drained);
      this.#dispatchBatch(buffer, batch);
    }
  }

  #dispatchBatch(buffer: ChannelBuffer, batch: RealtimeMessage[]): void {
    for (const message of batch) {
      for (const handler of buffer.handlers) {
        try {
          handler(message);
        } catch (cause) {
          const error = createAdapterError(
            cause instanceof Error ? cause.message : "Channel handler threw",
            { cause: cause instanceof Error ? cause : undefined }
          );
          this.#emitError(error);
        }
      }
    }
  }

  // ── Private: state transitions & emission ───────────────────

  #transitionTo(next: ConnectionState): void {
    if (this.#status === next) {
      return;
    }
    const allowed = ALLOWED_TRANSITIONS[this.#status];
    if (!allowed.has(next)) {
      return;
    }
    this.#status = next;
    if (next === "disconnected") {
      this.#transport = null;
      this.#connectedAt = null;
    }
    this.#emit("statuschange", this.#snapshotState());
  }

  #snapshotState(): RealtimeControllerState {
    const channels = new Set<string>(this.#channels.keys());
    return getRealtimeControllerState({
      status: this.#status,
      transport: this.#transport,
      connectedAt: this.#connectedAt,
      lastMessageAt: this.#lastMessageAt,
      retryCount: this.#retryCount,
      nextRetryAt: this.#scheduledReconnect.nextRetryAt,
      channels,
      bufferedCount: this.#bufferedCount,
    });
  }

  #emitError(error: RealtimeError): void {
    this.#emit("error", error);
  }

  #emit<K extends keyof RealtimeEvents>(event: K, detail: RealtimeEvents[K]): void {
    if (this.isDestroyed) {
      return;
    }
    this.emit(event, detail);
  }

  #assertAlive(): void {
    if (this.#destroyed || this.isDestroyed) {
      throw new ToolkitError(
        `Cannot use RealtimeController "${this.id}" after destroy()`,
        "CONTROLLER_DESTROYED"
      );
    }
  }
}

// ── Internal helpers ────────────────────────────────────────────

interface CloseEventLike {
  code?: number;
  reason?: string;
  cause?: Error;
}

interface TransportErrorEvent {
  message?: string;
  retryable?: boolean;
}

interface AdapterEventTarget {
  addEventListener?: (type: string, listener: (event: Event) => void) => void;
  removeEventListener?: (type: string, listener: (event: Event) => void) => void;
}

function extractDetail(event: Event): unknown {
  if ("detail" in event) {
    return (event as CustomEvent).detail;
  }
  return undefined;
}

function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterFactor: number,
  random: () => number
): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  const base = Math.max(1, baseDelayMs);
  const cap = Math.max(base, maxDelayMs);
  const jitter = Math.min(1, Math.max(0, jitterFactor));
  const raw = Math.min(cap, base * 2 ** Math.min(safeAttempt, 31));
  const window = raw * jitter * 2;
  const offset = jitter <= 0 ? raw : raw * (1 - jitter) + window * safeRandom(random);
  return Math.max(0, Math.floor(offset));
}

function safeRandom(random: () => number): number {
  try {
    const sample = random();
    if (typeof sample === "number" && Number.isFinite(sample)) {
      return sample;
    }
  } catch {
    /* fall through */
  }
  return Math.random();
}

function toSendError(cause: unknown): RealtimeError {
  if (cause instanceof Error && cause.name === "RealtimeError") {
    return cause as unknown as RealtimeError;
  }
  const messageText =
    cause instanceof Error
      ? cause.message
      : typeof cause === "string"
        ? cause
        : "Adapter rejected send()";
  return createAdapterError(messageText, {
    cause: cause instanceof Error ? cause : undefined,
  });
}

/**
 * Minimal heartbeat surface used by the controller. Wraps the
 * four timer primitives the heartbeat manager needs.
 */
interface HeartbeatLike {
  start(
    sendHeartbeat: () => Promise<void>,
    onTimeout: () => void,
    intervalMs: number,
    timeoutMs: number
  ): void;
  stop(): void;
  recordPong(): void;
}

function createHeartbeatAdapter(
  timers: NormalizedRealtimeControllerConfig["timers"]
): HeartbeatLike {
  const manager = new HeartbeatManager(timers);
  return {
    start(sendHeartbeat, onTimeout, intervalMs, timeoutMs) {
      manager.start(sendHeartbeat, onTimeout, intervalMs, timeoutMs);
    },
    stop() {
      manager.stop();
    },
    recordPong() {
      manager.recordPong();
    },
  };
}

/**
 * Reconnect surface. The controller composes a small facade
 * around {@link ReconnectManager} so the controller's
 * reconnect logic is testable in isolation.
 */
interface ReconnectLike {
  cancel(): void;
  schedule(attempt: number, onFire: () => void, onReconnect: (delayMs: number) => void): void;
  isPending: boolean;
}

function createReconnectAdapter(
  _timers: NormalizedRealtimeControllerConfig["timers"],
  _random: () => number
): ReconnectLike {
  // Reconnect is driven inline by the controller; the
  // `ReconnectManager` from utils/ is a more general abstraction
  // we use in v0.2.0+. For now this stub keeps the seam open.
  return {
    cancel: () => undefined,
    schedule: () => undefined,
    get isPending() {
      return false;
    },
  };
}

/**
 * Visibility surface. The controller composes a small facade
 * around {@link VisibilityManager} so the controller remains
 * SSR-safe (no `document` reference at module evaluation).
 */
interface VisibilityLike {
  start(onHidden: () => void, onVisible: () => void): void;
  stop(): void;
  isVisible: boolean;
}

function createVisibilityAdapter(): VisibilityLike {
  const manager = new VisibilityManager();
  return {
    start(onHidden, onVisible) {
      manager.start(onHidden, onVisible);
    },
    stop() {
      manager.stop();
    },
    get isVisible() {
      return manager.isVisible;
    },
  };
}
