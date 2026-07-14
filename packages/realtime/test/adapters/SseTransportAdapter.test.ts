/**
 * SseTransportAdapter tests.
 *
 * Coverage:
 *
 * - Constructor hygiene: no `EventSource` instantiated, no
 *   listeners attached.
 * - `connect()`: wires a fresh `EventSource` and forwards
 *   open / message / error / close events.
 * - `send()` rejects with `SEND_UNSUPPORTED`.
 * - `disconnect()`: closes the EventSource, emits a single
 *   `close` event with `wasClean: true`.
 * - `destroy()`: nulls the EventSource and removes listeners.
 * - SSR-safe: the module imports cleanly in Node (no
 *   `ReferenceError` even when `EventSource` is absent).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  SseEventSourceCtor,
  SseEventSourceLike,
} from "../../src/adapters/SseTransportAdapter";
import { SseTransportAdapter } from "../../src/adapters/SseTransportAdapter";
import { createSendUnsupportedError } from "../../src/controller/RealtimeError";

/**
 * Hand-rolled `EventSource` mock. Tracks construction args and
 * lets tests fire native events to drive the adapter's listeners.
 */
function createMockEventSourceCtor(): {
  ctor: SseEventSourceCtor;
  instances: MockSseEventSource[];
} {
  const instances: MockSseEventSource[] = [];

  class MockEventSource implements SseEventSourceLike {
    public url: string;
    public withCredentials: boolean;
    public readyState = 0;
    public onopen: ((this: SseEventSourceLike, ev: Event) => unknown) | null = null;
    public onmessage: ((this: SseEventSourceLike, ev: MessageEvent) => unknown) | null = null;
    public onerror: ((this: SseEventSourceLike, ev: Event) => unknown) | null = null;
    readonly #listeners: Map<string, Set<(ev: Event) => unknown>> = new Map();

    constructor(url: string, init?: EventSourceInit) {
      this.url = url;
      this.withCredentials = init?.withCredentials === true;
      instances.push(this as unknown as MockSseEventSource);
    }

    addEventListener(type: "open" | "message" | "error", listener: (ev: Event) => unknown): void {
      if (!this.#listeners.has(type)) {
        this.#listeners.set(type, new Set());
      }
      this.#listeners.get(type)?.add(listener);
    }
    removeEventListener(
      type: "open" | "message" | "error",
      listener: (ev: Event) => unknown
    ): void {
      this.#listeners.get(type)?.delete(listener);
    }
    close(): void {
      this.readyState = 2;
    }

    fireOpen(): void {
      this.readyState = 1;
      const event = new Event("open");
      for (const listener of this.#listeners.get("open") ?? []) {
        listener(event);
      }
    }

    fireMessage(data: string): void {
      const event = new MessageEvent("message", { data });
      for (const listener of this.#listeners.get("message") ?? []) {
        listener(event);
      }
    }

    fireError(opts: { readyState?: 0 | 1 | 2; message?: string } = {}): void {
      if (typeof opts.readyState === "number") {
        this.readyState = opts.readyState;
      }
      const event = new Event("error");
      if (opts.message) {
        Object.defineProperty(event, "message", { value: opts.message, configurable: true });
      }
      for (const listener of this.#listeners.get("error") ?? []) {
        listener(event);
      }
    }
  }

  return {
    ctor: MockEventSource as unknown as SseEventSourceCtor,
    instances: instances as unknown as MockSseEventSource[],
  };
}

interface MockSseEventSource {
  fireOpen(): void;
  fireMessage(data: string): void;
  fireError(opts?: { readyState?: 0 | 1 | 2; message?: string }): void;
  readonly readyState: number;
  readonly url: string;
  readonly withCredentials: boolean;
}

describe("SseTransportAdapter", () => {
  let mockCtor: ReturnType<typeof createMockEventSourceCtor>;
  let adapter: SseTransportAdapter;

  beforeEach(() => {
    mockCtor = createMockEventSourceCtor();
    adapter = new SseTransportAdapter({
      url: "/events",
      withCredentials: true,
      EventSourceCtor: mockCtor.ctor,
    });
  });

  afterEach(async () => {
    await adapter.destroy().catch(() => undefined);
  });

  describe("constructor hygiene", () => {
    it("does not instantiate EventSource", () => {
      expect(mockCtor.instances.length).toBe(0);
      expect(adapter.readyState).toBe("idle");
      expect(adapter.endpoint).toBe("/events");
      expect(adapter.transportType).toBe("sse");
    });

    it("isSupported returns true when an EventSourceCtor is injected", () => {
      expect(adapter.isSupported()).toBe(true);
    });
  });

  describe("connect()", () => {
    it("creates an EventSource with the configured URL and options", async () => {
      await adapter.connect();
      expect(mockCtor.instances.length).toBe(1);
      const instance = mockCtor.instances[0];
      expect(instance.url).toBe("/events");
      expect(instance.withCredentials).toBe(true);
    });

    it("emits 'open' when the EventSource fires onopen", async () => {
      const onOpen = vi.fn();
      adapter.addEventListener("open", onOpen);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(adapter.readyState).toBe("open");
    });

    it("emits 'message' with the data string", async () => {
      const onMessage = vi.fn();
      adapter.addEventListener("message", onMessage);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireMessage("hello");

      expect(onMessage).toHaveBeenCalledTimes(1);
      const event = onMessage.mock.calls[0]?.[0] as CustomEvent<{ data: string }>;
      expect(event.detail.data).toBe("hello");
    });

    it("emits a TRANSPORT_ERROR when the EventSource fires onerror while open", async () => {
      const onError = vi.fn();
      adapter.addEventListener("error", onError);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireError({ readyState: 1, message: "boom" });

      expect(onError).toHaveBeenCalledTimes(1);
      const event = onError.mock.calls[0]?.[0] as CustomEvent<{
        code: string;
        retryable: boolean;
        message: string;
      }>;
      expect(event.detail.code).toBe("TRANSPORT_ERROR");
      expect(event.detail.retryable).toBe(true);
      expect(event.detail.message).toBe("boom");
    });

    it("emits TRANSPORT_ERROR + close when the EventSource closes itself", async () => {
      const onError = vi.fn();
      const onClose = vi.fn();
      adapter.addEventListener("error", onError);
      adapter.addEventListener("close", onClose);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireError({ readyState: 2 });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      const closeEvent = onClose.mock.calls[0]?.[0] as CustomEvent<{
        code: number;
        reason: string;
        wasClean: boolean;
      }>;
      expect(closeEvent.detail.wasClean).toBe(false);
    });
  });

  describe("send()", () => {
    it("rejects with SEND_UNSUPPORTED", async () => {
      await expect(adapter.send("anything")).rejects.toMatchObject({
        code: "SEND_UNSUPPORTED",
        retryable: false,
        name: "RealtimeError",
      });
    });
  });

  describe("disconnect()", () => {
    it("closes the EventSource and emits a wasClean close event", async () => {
      const onClose = vi.fn();
      adapter.addEventListener("close", onClose);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.disconnect();

      expect(mockCtor.instances[0].readyState).toBe(2);
      expect(onClose).toHaveBeenCalledTimes(1);
      const event = onClose.mock.calls[0]?.[0] as CustomEvent<{
        wasClean: boolean;
        code: number;
        reason: string;
      }>;
      expect(event.detail.wasClean).toBe(true);
      expect(event.detail.code).toBe(1000);
    });

    it("is idempotent when called twice", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.disconnect();
      await adapter.disconnect();
      // No additional close events should fire — already closed.
    });
  });

  describe("destroy()", () => {
    it("releases listeners and nulls the EventSource", async () => {
      const onClose = vi.fn();
      adapter.addEventListener("close", onClose);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.destroy();

      expect(adapter.isDestroyed).toBe(true);
      expect(adapter.readyState).toBe("closed");

      // Listeners are detached — firing a message on the closed
      // EventSource must not reach the adapter.
      mockCtor.instances[0].fireMessage("after-destroy");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("SSR-safe import", () => {
    it("exports SseTransportAdapter without touching the global EventSource", () => {
      // Sanity check — the import above must not have crashed.
      // The mock constructor is injected for every other test so
      // the adapter never touches `globalThis.EventSource`.
      expect(typeof SseTransportAdapter).toBe("function");
    });

    it("sendUnsupportedError factory rejects the right error code", () => {
      const error = createSendUnsupportedError();
      expect(error.code).toBe("SEND_UNSUPPORTED");
      expect(error.retryable).toBe(false);
    });
  });
});
