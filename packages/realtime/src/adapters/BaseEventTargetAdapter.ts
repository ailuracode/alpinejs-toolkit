/**
 * Shared base for browser-API transport adapters.
 *
 * `SseTransportAdapter` and `WsTransportAdapter` both wrap a
 * single browser transport (`EventSource` / `WebSocket`), normalise
 * its lifecycle into the adapter contract, and surface open /
 * message / error / close events through a typed `EventTarget`.
 *
 * The contract documented in `RealtimeTransportAdapter` does not
 * extend `EventTarget` directly — adapters satisfy it by exposing
 * the required methods AND extending `EventTarget` so the
 * controller can wire listeners via `addEventListener`.
 *
 * Constructors MUST stay side-effect free. The base class is
 * intentionally trivial; everything reactive lives in subclasses.
 *
 * @module
 */

import type {
  RealtimeAdapterReadyState,
  RealtimeTransportAdapter,
} from "./RealtimeTransportAdapter";

/**
 * Closed lifecycle states the adapter moves through. Mirrors the
 * native browser transports' `readyState` vocabulary so callers
 * can switch on a single label.
 */
const READY_STATE_TRANSITIONS: Readonly<
  Record<RealtimeAdapterReadyState, ReadonlySet<RealtimeAdapterReadyState>>
> = {
  idle: new Set<RealtimeAdapterReadyState>(["connecting", "open", "closed"]),
  connecting: new Set<RealtimeAdapterReadyState>(["open", "closed", "error"]),
  open: new Set<RealtimeAdapterReadyState>(["closing", "closed", "error"]),
  closing: new Set<RealtimeAdapterReadyState>(["closed", "error"]),
  closed: new Set<RealtimeAdapterReadyState>(["connecting", "open"]),
  error: new Set<RealtimeAdapterReadyState>(["connecting", "closed"]),
};

/**
 * Base class for browser-API transport adapters.
 *
 * Extends `EventTarget` so the controller can subscribe via
 * `addEventListener('open' | 'message' | 'close' | 'error', ...)`.
 * Subclasses drive the state machine via {@link setReadyState}
 * and emit typed `CustomEvent`s via {@link dispatchAdapterEvent}.
 *
 * The constructor does not instantiate any browser API; the
 * concrete subclass calls `new EventSource(...)` / `new WebSocket(...)`
 * inside `connect()`. This keeps the adapter importable in Node
 * and any other non-browser environment.
 */
export abstract class BaseEventTargetAdapter
  extends EventTarget
  implements RealtimeTransportAdapter
{
  abstract readonly transportType: RealtimeTransportAdapter["transportType"];
  abstract readonly endpoint: string;
  readonly options: Readonly<Record<string, unknown>>;

  #readyState: RealtimeAdapterReadyState = "idle";
  #destroyed = false;

  constructor(options: Readonly<Record<string, unknown>> = {}) {
    super();
    this.options = options;
  }

  /** Current ready state. Mirrors the WebSocket state vocabulary. */
  get readyState(): RealtimeAdapterReadyState {
    return this.#readyState;
  }

  /** True once {@link destroy} has been called. */
  get isDestroyed(): boolean {
    return this.#destroyed;
  }

  /**
   * Move the state machine forward. The transition is silently
   * dropped when the source → target pair is not allowed so a
   * misbehaving native event (e.g. `error` arriving after
   * `close`) cannot corrupt the snapshot consumers see.
   */
  protected setReadyState(next: RealtimeAdapterReadyState): void {
    if (this.#destroyed && next !== "closed") {
      return;
    }
    if (this.#readyState === next) {
      return;
    }
    const allowed = READY_STATE_TRANSITIONS[this.#readyState];
    if (!allowed.has(next)) {
      return;
    }
    this.#readyState = next;
  }

  /**
   * Mark the adapter as destroyed. Subclasses call this from
   * their `destroy()` after releasing browser handles so the
   * readyState cannot transition again.
   */
  protected markDestroyed(): void {
    this.#destroyed = true;
    this.#readyState = "closed";
  }

  /**
   * Dispatch a typed `CustomEvent` on this adapter. Subclasses
   * use this from their browser-API event handlers so the
   * controller and any other listener receives the same payload
   * shape regardless of transport.
   */
  protected dispatchAdapterEvent<T>(type: string, detail: T): boolean {
    const event = new CustomEvent<T>(type, { detail });
    return this.dispatchEvent(event);
  }

  /**
   * Dispatch a bare `Event` (no detail). Used for `'open'` to
   * stay symmetric with the spec.
   */
  protected dispatchOpenEvent(): boolean {
    return this.dispatchEvent(new Event("open"));
  }

  /**
   * `@ailuracode/alpine-realtime` ships as `sideEffects: false`
   * so this default is fine for consumers that don't set
   * `EventSource`/`WebSocket`. Subclasses MUST override with a
   * runtime detection (e.g. `typeof EventSource !== "undefined"`).
   */
  isSupported(): boolean {
    return true;
  }

  abstract connect(): Promise<void>;
  abstract send(data: string | ArrayBuffer | Blob): Promise<void>;
  abstract sendHeartbeat(payload?: unknown): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract destroy(): Promise<void> | void;
}
