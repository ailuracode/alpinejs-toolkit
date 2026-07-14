/**
 * WebSocket transport adapter.
 *
 * Wraps the native `WebSocket` so the realtime controller can
 * subscribe to bidirectional sockets. The adapter:
 *
 * - Builds the `WebSocket` lazily inside `connect()` — the
 *   constructor is side-effect free so the adapter is importable
 *   in Node / SSR / test environments without a DOM.
 * - Forwards `send()` for `string`, `ArrayBuffer`, and `Blob`
 *   payloads. JSON is the dominant use case but binary frames
 *   round-trip without modification.
 * - Surfaces `onmessage`, `onerror`, and `onclose` through a
 *   typed `EventTarget` so the controller can subscribe with
 *   `addEventListener`.
 * - `sendHeartbeat(payload)` forwards the payload verbatim. For
 *   a real ping/pong pair, callers usually pair this with a
 *   server that responds to the textual `'ping'` (or a binary
 *   ping frame) — the controller's heartbeat manager handles the
 *   timeout.
 *
 * @module
 */

import { createTransportError, RealtimeError } from "../controller/RealtimeError";
import { BaseEventTargetAdapter } from "./BaseEventTargetAdapter";
import type { RealtimeTransportAdapter } from "./RealtimeTransportAdapter";

/**
 * Subset of the native `WebSocket` surface the adapter relies on.
 * The contract intentionally mirrors only what we need so tests
 * can supply hand-rolled mocks without depending on DOM lib
 * visibility.
 */
export interface WsLike {
  readonly url: string;
  readonly protocol: string;
  binaryType: BinaryType;
  readonly readyState: number;
  onopen: ((this: WsLike, ev: Event) => unknown) | null;
  onmessage: ((this: WsLike, ev: MessageEvent) => unknown) | null;
  onerror: ((this: WsLike, ev: Event) => unknown) | null;
  onclose: ((this: WsLike, ev: CloseEvent) => unknown) | null;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
}

/**
 * Constructor signature for the native `WebSocket`. Tests inject
 * a fake implementation so the adapter can be exercised in Node
 * and SSR.
 */
export type WsCtor = new (url: string, protocols?: string | string[]) => WsLike;

/** Native WebSocket binary type vocabulary. */
export type WsBinaryType = "arraybuffer" | "blob";

/**
 * Options consumed by {@link WsTransportAdapter}.
 *
 * - `url` — required WebSocket endpoint (`ws://` or `wss://`).
 * - `protocols` — optional subprotocol(s) per the WHATWG spec.
 * - `binaryType` — `'arraybuffer'` (default) or `'blob'`. Applied
 *   to the underlying `WebSocket` before the first send.
 * - `heartbeatPing` — opaque payload string forwarded on
 *   `sendHeartbeat()`. Defaults to `'ping'`.
 * - `WebSocketCtor` — inject a fake constructor for tests.
 */
export interface WsTransportAdapterOptions {
  readonly url: string;
  readonly protocols?: string | string[];
  readonly binaryType?: WsBinaryType;
  readonly heartbeatPing?: string;
  readonly WebSocketCtor?: WsCtor;
}

/** Native WebSocket readyState values. */
const WS_READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

/**
 * WebSocket adapter.
 *
 * @example
 * ```ts
 * const adapter = new WsTransportAdapter({ url: "wss://api.example.com/ws" });
 * adapter.addEventListener("open", () => adapter.send("hello"));
 * adapter.addEventListener("message", (e) => console.log(e.detail.data));
 * await adapter.connect();
 * ```
 */
export class WsTransportAdapter extends BaseEventTargetAdapter {
  readonly transportType: RealtimeTransportAdapter["transportType"] = "websocket";
  readonly endpoint: string;
  readonly #protocols: string | string[] | undefined;
  readonly #binaryType: WsBinaryType;
  readonly #heartbeatPing: string;
  readonly #WebSocketCtor: WsCtor | undefined;

  #ws: WsLike | null = null;
  #didEmitOpen = false;
  #destroyed = false;

  constructor(options: WsTransportAdapterOptions) {
    super({ protocols: options.protocols, binaryType: options.binaryType ?? "arraybuffer" });
    this.endpoint = options.url;
    this.#protocols = options.protocols;
    this.#binaryType = options.binaryType ?? "arraybuffer";
    this.#heartbeatPing = options.heartbeatPing ?? "ping";
    this.#WebSocketCtor = options.WebSocketCtor;
  }

  /**
   * `true` when the runtime exposes a native `WebSocket`
   * constructor (or a test-injected one). The controller
   * consults this before invoking `connect()`.
   */
  override isSupported(): boolean {
    if (this.#WebSocketCtor) {
      return true;
    }
    return typeof WebSocket !== "undefined";
  }

  async connect(): Promise<void> {
    await Promise.resolve();
    if (this.isDestroyed) {
      throw new RealtimeError("WsTransportAdapter: connect() after destroy()", "ADAPTER_ERROR", {
        retryable: false,
      });
    }
    if (this.#ws) {
      return;
    }

    const Ctor = this.#WebSocketCtor ?? globalWebSocketCtor();
    if (!Ctor) {
      throw new RealtimeError(
        "WsTransportAdapter: WebSocket is not available in this runtime",
        "ADAPTER_ERROR",
        { retryable: false }
      );
    }

    this.setReadyState("connecting");
    this.#didEmitOpen = false;

    let ws: WsLike;
    try {
      ws = new Ctor(this.endpoint, this.#protocols);
    } catch (cause) {
      this.setReadyState("error");
      throw createTransportError(
        cause instanceof Error ? cause.message : "Failed to construct WebSocket",
        { cause: cause instanceof Error ? cause : undefined }
      );
    }

    this.#ws = ws;
    try {
      ws.binaryType = this.#binaryType;
    } catch {
      // Some test doubles reject setter writes; ignore.
    }

    ws.onopen = (): void => this.#handleOpen();
    ws.onmessage = (event): void => this.#handleMessage(event);
    ws.onerror = (event): void => this.#handleError(event);
    ws.onclose = (event): void => this.#handleClose(event);
  }

  /**
   * Forward a frame on the WebSocket. Accepts the three native
   * payload shapes (`string`, `ArrayBuffer`, `Blob`).
   *
   * The adapter does NOT serialise JSON — `controller.publish()`
   * runs `config.serialize()` and hands the raw frame to
   * `adapter.send()`. Consumers that want richer framing encode
   * themselves and pass the bytes here.
   */
  async send(data: string | ArrayBuffer | Blob): Promise<void> {
    await Promise.resolve();
    const ws = this.#ws;
    if (!ws) {
      throw createTransportError("WsTransportAdapter: send() before connect()");
    }
    if (ws.readyState !== WS_READY_STATE.OPEN) {
      throw createTransportError(`WsTransportAdapter: send() while readyState=${ws.readyState}`, {
        cause: new Error(`readyState=${ws.readyState}`),
      });
    }
    try {
      ws.send(data);
    } catch (cause) {
      throw createTransportError(
        cause instanceof Error ? cause.message : "WebSocket.send() threw",
        { cause: cause instanceof Error ? cause : undefined }
      );
    }
  }

  /**
   * Send a heartbeat ping. The default payload is the string
   * `'ping'`. Servers that expect a binary frame receive the
   * payload as-is when callers pass `ArrayBuffer` / `Blob`.
   */
  async sendHeartbeat(payload?: unknown): Promise<void> {
    const ws = this.#ws;
    if (!ws) {
      return;
    }
    if (typeof payload === "string" || payload instanceof ArrayBuffer || payload instanceof Blob) {
      await this.send(payload);
      return;
    }
    if (payload === undefined) {
      await this.send(this.#heartbeatPing);
      return;
    }
    // Coerce arbitrary payloads to a string. The controller's
    // default `heartbeatPayload` is `{ type: "ping" }`; we leave
    // the serialisation to the adapter so callers don't have to
    // opt in to JSON.
    await this.send(JSON.stringify(payload));
  }

  async disconnect(): Promise<void> {
    await Promise.resolve();
    if (this.isDestroyed) {
      this.setReadyState("closed");
      return;
    }
    const ws = this.#ws;
    if (!ws) {
      this.setReadyState("closed");
      return;
    }
    const wasOpen = ws.readyState === WS_READY_STATE.OPEN;
    try {
      ws.close(1000, "client disconnect");
    } catch {
      /* swallow — disconnect is best-effort */
    }
    if (wasOpen) {
      this.setReadyState("closed");
      this.#emitClose({
        code: 1000,
        reason: "client disconnect",
        wasClean: true,
      });
    } else {
      this.setReadyState("closed");
    }
  }

  async destroy(): Promise<void> {
    await Promise.resolve();
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;

    const ws = this.#ws;
    if (ws) {
      // Detach handlers so the controller's listener doesn't
      // re-emit during teardown.
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close(1000, "destroy");
      } catch {
        /* swallow */
      }
    }
    this.#ws = null;

    this.#emitClose({
      code: 1000,
      reason: "destroy",
      wasClean: true,
    });

    this.markDestroyed();
  }

  // ── Internal: WebSocket event handlers ────────────────────────

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

  #handleMessage(event: MessageEvent): void {
    if (this.isDestroyed) {
      return;
    }
    const data = event.data;
    if (typeof data === "string" || data instanceof ArrayBuffer || data instanceof Blob) {
      this.dispatchAdapterEvent("message", { data });
      return;
    }
    // ArrayBufferView (TypedArray / DataView) — wrap in
    // ArrayBuffer so consumers see the canonical binary shape.
    if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView;
      this.dispatchAdapterEvent("message", {
        data: view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer,
      });
      return;
    }
    const error = createTransportError(
      `WsTransportAdapter: unexpected message payload type ${typeof data}`
    );
    this.dispatchAdapterEvent("error", error);
  }

  #handleError(event: Event): void {
    if (this.isDestroyed) {
      return;
    }
    this.setReadyState("error");
    const eventMessage = (event as { message?: unknown }).message;
    const messageText =
      typeof eventMessage === "string" && eventMessage.length > 0
        ? eventMessage
        : "WebSocket emitted an error event";
    const error = createTransportError(messageText);
    this.dispatchAdapterEvent("error", error);
  }

  #handleClose(event: CloseEvent): void {
    if (this.isDestroyed) {
      return;
    }
    this.setReadyState("closed");
    const code = typeof event?.code === "number" ? event.code : 1005;
    const reason = typeof event?.reason === "string" ? event.reason : "";
    const wasClean = code === 1000 || code === 1001;
    this.#emitClose({ code, reason, wasClean });
  }

  #emitClose(detail: { code: number; reason: string; wasClean: boolean }): void {
    if (this.#destroyed && detail.reason !== "destroy") {
      return;
    }
    this.dispatchAdapterEvent("close", detail);
  }
}

/**
 * Resolve the global `WebSocket` constructor when available.
 * Returns `undefined` in Node, jsdom-less test environments,
 * and any other SSR context.
 */
function globalWebSocketCtor(): WsCtor | undefined {
  if (typeof WebSocket === "undefined") {
    return undefined;
  }
  return WebSocket as unknown as WsCtor;
}
