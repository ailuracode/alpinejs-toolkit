/**
 * Test helpers for `@ailuracode/alpine-realtime`.
 *
 * Exports as `@ailuracode/alpine-realtime/test` (the package
 * `exports` field adds a `./test` subpath in package.json).
 * Consumers writing integration tests for the realtime
 * controller should import from this entrypoint so the helpers
 * stay decoupled from the headless surface.
 *
 * The mock transport is a plain object — tests can wrap any of
 * its public methods with `vi.spyOn` to get full Vitest spy
 * capabilities. The helpers also expose `callLog`, an
 * append-only record of every public call, for tests that just
 * need a chronological trace.
 *
 * @module
 */

import type {
  RealtimeAdapterReadyState,
  RealtimeTransportAdapter,
} from "../adapters/RealtimeTransportAdapter";
import {
  DEFAULT_REALTIME_CHANNEL,
  type RealtimeControllerConfig,
  validateRealtimeControllerConfig,
} from "../controller/RealtimeControllerConfig";

/**
 * Options accepted by {@link createMockTransport}.
 *
 * `autoOpen` — when `true` (default), the adapter emits an
 *   `open` event on a microtask after `connect()` resolves.
 *   Tests that want to assert a `"connecting"` state pass
 *   `autoOpen: false` and call `mock.emitOpen()` manually.
 *
 * `isSupported` — overrides `isSupported()`. Default: `true`.
 */
export interface MockTransportOptions {
  readonly transportType?: RealtimeTransportAdapter["transportType"];
  readonly endpoint?: string;
  readonly autoOpen?: boolean;
  readonly isSupported?: boolean;
  readonly initialReadyState?: RealtimeAdapterReadyState;
}

/**
 * Mock adapter handle returned by {@link createMockTransport}.
 * Mirrors the public surface of `RealtimeTransportAdapter` and
 * adds a programmable event emitter so tests can drive
 * transport-level conditions from outside.
 */
export interface MockTransport extends RealtimeTransportAdapter {
  /** Programmatically emit an `open` event. */
  emitOpen(): void;
  /** Programmatically emit a `close` event. */
  emitClose(detail?: { code?: number; reason?: string }): void;
  /** Programmatically emit a `message` event with a raw frame. */
  emitMessage(data: string | ArrayBuffer): void;
  /** Programmatically emit an `error` event. */
  emitError(detail: { message: string; retryable?: boolean } | Error): void;

  /** Chronological log of every public method call. */
  readonly callLog: ReadonlyArray<MockTransportCall>;
  /** True after `destroy()` has been called. */
  readonly isDestroyed: boolean;
}

/**
 * Shape of a single recorded call on the mock transport.
 */
export interface MockTransportCall {
  readonly method:
    | "isSupported"
    | "connect"
    | "send"
    | "sendHeartbeat"
    | "disconnect"
    | "destroy"
    | "emitOpen"
    | "emitClose"
    | "emitMessage"
    | "emitError";
  readonly args: readonly unknown[];
}

/**
 * Create a mock transport adapter. The returned object is
 * structurally a `RealtimeTransportAdapter` and additionally
 * exposes `emitOpen()`, `emitClose()`, etc. so tests can
 * simulate transport events.
 *
 * The mock is also a DOM `EventTarget`; tests may either
 * `addEventListener` on it or use the `emit*` helpers. The
 * two routes are equivalent.
 */
export function createMockTransport(options: MockTransportOptions = {}): MockTransport {
  const target = new EventTargetShim();
  const transportType = options.transportType ?? "sse";
  const endpoint = options.endpoint ?? "mock://realtime";
  const autoOpen = options.autoOpen ?? true;
  const supported = options.isSupported ?? true;
  let readyState: RealtimeAdapterReadyState = options.initialReadyState ?? "idle";
  let destroyed = false;
  const callLog: MockTransportCall[] = [];

  const record = (method: MockTransportCall["method"], args: readonly unknown[]): void => {
    callLog.push({ method, args });
  };

  const adapter = {
    transportType,
    endpoint,
    options: {},
    get readyState(): RealtimeAdapterReadyState {
      return readyState;
    },

    isSupported(): boolean {
      record("isSupported", []);
      return supported && !destroyed;
    },

    connect(): Promise<void> {
      record("connect", []);
      if (destroyed) {
        return Promise.reject(new Error("MockTransport: connect() after destroy()"));
      }
      readyState = "connecting";
      if (autoOpen) {
        // Defer the open event so callers can `await connect()`
        // and then assert state before the event fires.
        queueMicrotask(() => {
          if (!destroyed) {
            readyState = "open";
            adapter.emitOpen();
          }
        });
      }
      return Promise.resolve();
    },

    send(data: string | ArrayBuffer | Blob): Promise<void> {
      record("send", [data]);
      if (destroyed) {
        return Promise.reject(new Error("MockTransport: send() after destroy()"));
      }
      if (readyState !== "open" && readyState !== "closing") {
        return Promise.reject(new Error("MockTransport: send() while transport is not open"));
      }
      return Promise.resolve();
    },

    sendHeartbeat(payload?: unknown): Promise<void> {
      record("sendHeartbeat", [payload]);
      if (destroyed) {
        return Promise.reject(new Error("MockTransport: sendHeartbeat() after destroy()"));
      }
      return Promise.resolve();
    },

    disconnect(): Promise<void> {
      record("disconnect", []);
      if (readyState === "closed" || readyState === "idle") {
        return Promise.resolve();
      }
      readyState = "closed";
      // Don't auto-emit close here — the controller initiated
      // the disconnect. Tests that want to simulate a transport
      // failure after a graceful disconnect should call
      // `mock.emitClose()` manually.
      return Promise.resolve();
    },

    destroy(): void {
      record("destroy", []);
      destroyed = true;
      readyState = "closed";
    },

    emitOpen(): void {
      record("emitOpen", []);
      target.dispatch("open", {});
    },

    emitClose(detail: { code?: number; reason?: string } = {}): void {
      record("emitClose", [detail]);
      target.dispatch("close", { code: detail.code, reason: detail.reason });
    },

    emitMessage(data: string | ArrayBuffer): void {
      record("emitMessage", [data]);
      target.dispatch("message", data);
    },

    emitError(detail: { message: string; retryable?: boolean } | Error): void {
      record("emitError", [detail]);
      const payload =
        detail instanceof Error
          ? { message: detail.message, retryable: true }
          : { message: detail.message, retryable: detail.retryable ?? true };
      target.dispatch("error", payload);
    },

    get callLog(): ReadonlyArray<MockTransportCall> {
      return callLog;
    },

    get isDestroyed(): boolean {
      return destroyed;
    },

    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };

  return adapter as unknown as MockTransport;
}

/**
 * Build a valid {@link RealtimeControllerConfig} for tests. Pass
 * `overrides` to change individual fields. The helper does NOT
 * normalize the config — the controller's own
 * {@link validateRealtimeControllerConfig} runs in the
 * constructor. Tests that need the normalized form can call
 * `validateRealtimeControllerConfig(mockRealtimeControllerConfig(...))`.
 */
export function mockRealtimeControllerConfig(
  overrides: Partial<RealtimeControllerConfig> = {}
): RealtimeControllerConfig {
  return {
    id: "test",
    transport: "sse",
    endpoint: "mock://realtime",
    defaultChannel: DEFAULT_REALTIME_CHANNEL,
    reconnect: true,
    maxRetries: 3,
    baseDelayMs: 10,
    maxDelayMs: 100,
    jitterFactor: 0,
    heartbeatIntervalMs: 0,
    heartbeatTimeoutMs: 50,
    pauseOnHidden: false,
    resumeOnVisible: true,
    highWaterMark: 100,
    ...overrides,
  };
}

/**
 * Create a deterministic fake-timer pair (setTimeout /
 * clearTimeout / setInterval / clearInterval). Tests can pass
 * this as `config.timers` to drive the controller with
 * `advance(ms)`.
 */
export function createFakeTimers(): MockTimers {
  const handles = new Map<number, { at: number; handler: () => void }>();
  const intervals = new Map<number, { every: number; handler: () => void; elapsed: number }>();
  let nextHandle = 1;
  let nextInterval = 100_000;

  const setTimeout = (handler: () => void, delayMs: number): number => {
    const handle = nextHandle++;
    handles.set(handle, { at: delayMs, handler });
    return handle;
  };

  const clearTimeout = (handle: number): void => {
    handles.delete(handle);
  };

  const setInterval = (handler: () => void, intervalMs: number): number => {
    const handle = nextInterval++;
    intervals.set(handle, { every: intervalMs, handler, elapsed: 0 });
    return handle;
  };

  const clearInterval = (handle: number): void => {
    intervals.delete(handle);
  };

  const fireTimeouts = (): void => {
    const ready: number[] = [];
    for (const [handle, entry] of handles) {
      if (entry.at <= 0) {
        ready.push(handle);
      }
    }
    for (const handle of ready) {
      const entry = handles.get(handle);
      handles.delete(handle);
      entry?.handler();
    }
  };

  const fireIntervals = (): void => {
    const ready: number[] = [];
    for (const [handle, entry] of intervals) {
      if (entry.elapsed >= entry.every && entry.elapsed % entry.every === 0) {
        ready.push(handle);
      }
    }
    for (const handle of ready) {
      const entry = intervals.get(handle);
      entry?.handler();
    }
  };

  const advance = (ms: number): void => {
    let remaining = ms;
    while (remaining > 0) {
      const step = computeStep(remaining);
      if (step === null) {
        break;
      }
      tick(step);
      remaining -= step;
      fireTimeouts();
      fireIntervals();
    }
  };

  const computeStep = (remaining: number): number | null => {
    let minStep = remaining;
    for (const interval of intervals.values()) {
      const toFire = interval.every - (interval.elapsed % interval.every);
      if (toFire > 0 && toFire < minStep) {
        minStep = toFire;
      }
    }
    for (const timeout of handles.values()) {
      if (timeout.at < minStep) {
        minStep = timeout.at;
      }
    }
    if (!Number.isFinite(minStep) || minStep <= 0) {
      return null;
    }
    return minStep;
  };

  const tick = (step: number): void => {
    for (const interval of intervals.values()) {
      interval.elapsed += step;
    }
    for (const timeout of handles.values()) {
      timeout.at -= step;
    }
  };

  const pendingTimeouts = (): number[] => [...handles.keys()];
  const pendingIntervals = (): number[] => [...intervals.keys()];

  return {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    advance,
    pendingTimeouts,
    pendingIntervals,
  };
}

export interface MockTimers {
  readonly setTimeout: (handler: () => void, delayMs: number) => number;
  readonly clearTimeout: (handle: number) => void;
  readonly setInterval: (handler: () => void, intervalMs: number) => number;
  readonly clearInterval: (handle: number) => void;
  readonly advance: (ms: number) => void;
  readonly pendingTimeouts: () => number[];
  readonly pendingIntervals: () => number[];
}

// ── Internal helpers ────────────────────────────────────────────

/**
 * Tiny `EventTarget` polyfill. The global `EventTarget` exists
 * in Node 18+ and happy-dom, so this shim is only used as a
 * defensive fallback. It implements just enough of the API for
 * the mock transport to dispatch events to the controller.
 */
class EventTargetShim {
  readonly #listeners: {
    open: Set<(event: Event) => void>;
    message: Set<(event: Event) => void>;
    close: Set<(event: Event) => void>;
    error: Set<(event: Event) => void>;
  } = {
    open: new Set(),
    message: new Set(),
    close: new Set(),
    error: new Set(),
  };

  addEventListener(type: string, listener: (event: Event) => void): void {
    const bag = this.#listenersFor(type);
    if (bag) {
      bag.add(listener);
    }
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    const bag = this.#listenersFor(type);
    if (bag) {
      bag.delete(listener);
    }
  }

  dispatch(type: string, detail: unknown): void {
    const bag = this.#listenersFor(type);
    if (!bag) {
      return;
    }
    const event = { type, detail } as unknown as Event;
    for (const listener of bag) {
      listener(event);
    }
  }

  #listenersFor(type: string): Set<(event: Event) => void> | null {
    switch (type) {
      case "open":
        return this.#listeners.open;
      case "message":
        return this.#listeners.message;
      case "close":
        return this.#listeners.close;
      case "error":
        return this.#listeners.error;
      default:
        return "default" in this.#listeners ? null : null;
    }
  }
}
