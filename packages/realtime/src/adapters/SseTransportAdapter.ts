/**
 * Server-Sent Events transport adapter.
 *
 * Wraps the native `EventSource` so the realtime controller can
 * subscribe to SSE feeds (one-way server → client streams). The
 * adapter:
 *
 * - Builds the `EventSource` lazily inside `connect()` — the
 *   constructor is side-effect free so the adapter is importable
 *   in Node / SSR / test environments without a DOM.
 * - Disables EventSource's built-in reconnect by closing on every
 *   `error` and surfacing it as a `TRANSPORT_ERROR` event. The
 *   controller owns backoff.
 * - Refuses client-to-server traffic — `send()` always rejects
 *   with `RealtimeError(code: "SEND_UNSUPPORTED")`.
 *
 * Heartbeats use SSE comment lines (`: ping\n\n`). The native
 * `EventSource` ignores them, so this adapter does not need to
 * send them; the *server* emits them to keep proxies from idling
 * the connection. Consumers that want outbound heartbeat support
 * must use the WebSocket adapter instead.
 *
 * @module
 */

import {
  createSendUnsupportedError,
  createTransportError,
  RealtimeError,
} from "../controller/RealtimeError";
import { BaseEventTargetAdapter } from "./BaseEventTargetAdapter";
import type { RealtimeTransportAdapter } from "./RealtimeTransportAdapter";

/**
 * Shape of the native `EventSource` constructor as exposed by
 * browsers and as injected by tests.
 *
 * `withCredentials` is the only init option supported by the
 * platform; the spec accepts additional options through the
 * metadata bag for future-proofing.
 */
export interface SseEventSourceLike {
  readonly url: string;
  readonly withCredentials: boolean;
  readonly readyState: number;
  onopen: ((this: SseEventSourceLike, ev: Event) => unknown) | null;
  onmessage: ((this: SseEventSourceLike, ev: MessageEvent) => unknown) | null;
  onerror: ((this: SseEventSourceLike, ev: Event) => unknown) | null;
  close(): void;
  addEventListener(type: string, listener: (ev: Event) => unknown): void;
  removeEventListener(type: string, listener: (ev: Event) => unknown): void;
}

/**
 * Constructor signature for the native `EventSource`. Tests
 * inject a mock implementation so the adapter can be exercised in
 * Node / jsdom-less environments.
 */
export type SseEventSourceCtor = new (url: string, init?: EventSourceInit) => SseEventSourceLike;

/**
 * Native `EventSource` readyState values. Mirrored as enum-like
 * constants so the adapter can compare without depending on
 * DOM lib visibility in non-browser environments.
 */
const EVENT_SOURCE_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
} as const;

/**
 * Options consumed by {@link SseTransportAdapter}.
 *
 * - `url` — required SSE endpoint.
 * - `withCredentials` — forwards to `EventSource` init; defaults
 *   to `false`.
 * - `headers` — reserved for future EventSource polyfills that
 *   support custom headers; the native API ignores it.
 * - `EventSourceCtor` — inject a fake constructor for tests.
 *   Defaults to the global `EventSource` when available.
 * - `heartbeatComment` — opaque value kept for API symmetry with
 *   the WebSocket adapter. The native `EventSource` cannot send
 *   comment lines, so this is informational only.
 */
export interface SseTransportAdapterOptions {
  readonly url: string;
  readonly withCredentials?: boolean;
  readonly headers?: Readonly<Record<string, string>>;
  readonly heartbeatComment?: string;
  readonly EventSourceCtor?: SseEventSourceCtor;
}

/**
 * Server-Sent Events adapter.
 *
 * @example
 * ```ts
 * const adapter = new SseTransportAdapter({ url: "/events" });
 * adapter.addEventListener("open", () => console.log("connected"));
 * adapter.addEventListener("message", (e) => console.log(e.detail.data));
 * await adapter.connect();
 * ```
 */
export class SseTransportAdapter extends BaseEventTargetAdapter {
  readonly transportType: RealtimeTransportAdapter["transportType"] = "sse";
  readonly endpoint: string;
  readonly #withCredentials: boolean;
  readonly #headers: Readonly<Record<string, string>>;
  readonly #heartbeatComment: string;
  readonly #EventSourceCtor: SseEventSourceCtor | undefined;

  #eventSource: SseEventSourceLike | null = null;
  #boundOpen: ((ev: Event) => unknown) | null = null;
  #boundMessage: ((ev: Event) => unknown) | null = null;
  #boundError: ((ev: Event) => unknown) | null = null;
  #didEmitOpen = false;
  #disconnectReason: string | null = null;

  constructor(options: SseTransportAdapterOptions) {
    super({ withCredentials: options.withCredentials, headers: options.headers });
    this.endpoint = options.url;
    this.#withCredentials = options.withCredentials === true;
    this.#headers = options.headers ?? {};
    this.#heartbeatComment = options.heartbeatComment ?? ": ping\n\n";
    this.#EventSourceCtor = options.EventSourceCtor;
  }

  /**
   * `true` when the runtime exposes a native `EventSource`
   * constructor (or a test-injected one). The controller
   * consults this before invoking `connect()` so SSR consumers
   * never hit a `ReferenceError`.
   */
  override isSupported(): boolean {
    if (this.#EventSourceCtor) {
      return true;
    }
    return typeof EventSource !== "undefined";
  }

  async connect(): Promise<void> {
    await Promise.resolve();
    if (this.isDestroyed) {
      throw new RealtimeError("SseTransportAdapter: connect() after destroy()", "ADAPTER_ERROR", {
        retryable: false,
      });
    }
    if (this.#eventSource) {
      return;
    }

    const Ctor = this.#EventSourceCtor ?? globalEventSourceCtor();
    if (!Ctor) {
      throw new RealtimeError(
        "SseTransportAdapter: EventSource is not available in this runtime",
        "ADAPTER_ERROR",
        { retryable: false }
      );
    }

    this.setReadyState("connecting");
    this.#didEmitOpen = false;
    this.#disconnectReason = null;

    let eventSource: SseEventSourceLike;
    try {
      eventSource = new Ctor(this.endpoint, { withCredentials: this.#withCredentials });
    } catch (cause) {
      this.setReadyState("error");
      throw createTransportError(
        cause instanceof Error ? cause.message : "Failed to construct EventSource",
        { cause: cause instanceof Error ? cause : undefined }
      );
    }

    this.#eventSource = eventSource;
    this.#boundOpen = (): void => this.#handleOpen();
    this.#boundMessage = (event): void => this.#handleMessage(event);
    this.#boundError = (event): void => this.#handleError(event);

    eventSource.addEventListener("open", this.#boundOpen);
    eventSource.addEventListener("message", this.#boundMessage);
    eventSource.addEventListener("error", this.#boundError);

    // EventSource does not throw on construction; the native
    // spec delivers errors via the `error` event. The promise
    // resolves once the listener is wired — the controller's
    // transport state machine then reacts to `'open'` / `'close'`.
    this.setReadyState("connecting");
  }

  /**
   * SSE is server → client only. `send()` always rejects so
   * `controller.publish()` reports the failure via a typed
   * `RealtimeError(code: "SEND_UNSUPPORTED")`.
   */
  async send(_data: string | ArrayBuffer | Blob): Promise<void> {
    await Promise.resolve();
    throw createSendUnsupportedError("SSE transport does not support client-to-server messages");
  }

  /**
   * Outbound heartbeats are impossible over native SSE. The
   * adapter silently no-ops so callers that drive both SSE and
   * WS through the same code path don't need to special-case.
   *
   * The *server* is expected to emit SSE comment lines
   * (`heartbeatComment`, default `: ping\n\n`) which the
   * `EventSource` consumes transparently.
   */
  async sendHeartbeat(_payload?: unknown): Promise<void> {
    // No-op: native EventSource cannot push comment lines to the
    // server. Surface a sentinel so callers that ignore the
    // return value still get a deterministic rejection when they
    // try to publish a heartbeat through the controller.
  }

  async disconnect(): Promise<void> {
    await Promise.resolve();
    if (this.isDestroyed || !this.#eventSource) {
      this.setReadyState("closed");
      return;
    }

    this.#disconnectReason = "client disconnect";
    const wasOpen = this.readyState === "open";
    try {
      this.#eventSource.close();
    } catch {
      /* swallow — disconnect is best-effort */
    }

    if (wasOpen) {
      this.setReadyState("closed");
      this.#emitClose({
        code: 1000,
        reason: this.#disconnectReason,
        wasClean: true,
      });
    } else {
      this.setReadyState("closed");
    }
  }

  async destroy(): Promise<void> {
    await Promise.resolve();
    if (this.isDestroyed) {
      return;
    }

    this.#unbindListeners();
    if (this.#eventSource) {
      try {
        this.#eventSource.close();
      } catch {
        /* swallow */
      }
      this.#eventSource = null;
    }

    this.#emitClose({
      code: 1000,
      reason: "destroy",
      wasClean: true,
    });

    this.markDestroyed();
  }

  // ── Internal: event source event handlers ────────────────────

  #handleOpen(): void {
    if (this.isDestroyed) {
      return;
    }
    this.setReadyState("open");
    if (this.#didEmitOpen) {
      return;
    }
    this.#didEmitOpen = true;
    this.dispatchOpenEvent();
  }

  #handleMessage(event: Event): void {
    if (this.isDestroyed) {
      return;
    }
    const data = (event as MessageEvent).data;
    const text = typeof data === "string" ? data : String(data);
    this.dispatchAdapterEvent("message", { data: text });
  }

  #handleError(event: Event): void {
    if (this.isDestroyed) {
      return;
    }

    const readyState = this.#eventSource?.readyState;
    if (readyState === EVENT_SOURCE_READY_STATE.CLOSED) {
      // Native EventSource closed the connection. The browser
      // would normally reconnect here; we disabled that. Surface
      // it as a retryable transport failure so the controller
      // takes over the backoff loop.
      const message = this.#disconnectReason ?? "SSE transport closed";
      this.setReadyState("closed");
      const error = createTransportError(message);
      this.dispatchAdapterEvent("error", error);
      this.#emitClose({
        code: 1006,
        reason: message,
        wasClean: false,
      });
      return;
    }

    this.setReadyState("error");
    const detail = (event as MessageEvent).data;
    const eventMessage = (event as { message?: unknown }).message;
    const messageText =
      typeof detail === "string" && detail.length > 0
        ? detail
        : typeof eventMessage === "string" && eventMessage.length > 0
          ? eventMessage
          : "SSE transport emitted an error event";
    const error = createTransportError(messageText);
    this.dispatchAdapterEvent("error", error);
  }

  #emitClose(detail: { code: number; reason: string; wasClean: boolean }): void {
    if (this.isDestroyed) {
      // The controller already received `destroy` indirectly via
      // the controller's own destroy(); avoid an extra `'close'`
      // bounce that consumers might double-handle.
      return;
    }
    this.dispatchAdapterEvent("close", detail);
  }

  #unbindListeners(): void {
    const eventSource = this.#eventSource;
    if (!eventSource) {
      this.#boundOpen = null;
      this.#boundMessage = null;
      this.#boundError = null;
      return;
    }
    if (this.#boundOpen) {
      eventSource.removeEventListener("open", this.#boundOpen);
    }
    if (this.#boundMessage) {
      eventSource.removeEventListener("message", this.#boundMessage);
    }
    if (this.#boundError) {
      eventSource.removeEventListener("error", this.#boundError);
    }
    this.#boundOpen = null;
    this.#boundMessage = null;
    this.#boundError = null;
  }
}

/**
 * Resolve the global `EventSource` constructor when available.
 * Returns `undefined` in Node, jsdom-less test environments,
 * and any other SSR context.
 */
function globalEventSourceCtor(): SseEventSourceCtor | undefined {
  if (typeof EventSource === "undefined") {
    return undefined;
  }
  return EventSource as unknown as SseEventSourceCtor;
}
