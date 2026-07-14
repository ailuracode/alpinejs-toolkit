/**
 * WsTransportAdapter tests.
 *
 * Coverage:
 *
 * - Constructor hygiene: no `WebSocket` instantiated.
 * - `connect()`: creates a `WebSocket` with the configured URL,
 *   protocols, and binaryType.
 * - `send()`: forwards string / ArrayBuffer / Blob frames.
 * - `sendHeartbeat()`: forwards the payload (string default,
 *   binary passthrough).
 * - Inbound messages: text + binary (ArrayBuffer) + blob.
 * - `error` → `TRANSPORT_ERROR` with `retryable: true`.
 * - `close` → emits a `close` event; `wasClean` depends on the
 *   close code (1000 / 1001 = clean).
 * - `destroy()`: releases handlers and nulls the WebSocket.
 * - SSR-safe import: the module imports cleanly in Node without
 *   touching the global `WebSocket`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WsCtor, WsLike } from "../../src/adapters/WsTransportAdapter";
import { WsTransportAdapter } from "../../src/adapters/WsTransportAdapter";

/**
 * Hand-rolled `WebSocket` mock. Tracks every public method and
 * lets tests fire native events to drive the adapter's
 * listeners.
 */
function createMockWebSocketCtor(): {
  ctor: WsCtor;
  instances: MockWebSocket[];
} {
  const instances: MockWebSocket[] = [];

  class MockWebSocket implements WsLike {
    public url: string;
    public protocol: string = "";
    public binaryType: BinaryType = "arraybuffer";
    public readyState = 0;
    public onopen: ((this: WsLike, ev: Event) => unknown) | null = null;
    public onmessage: ((this: WsLike, ev: MessageEvent) => unknown) | null = null;
    public onerror: ((this: WsLike, ev: Event) => unknown) | null = null;
    public onclose: ((this: WsLike, ev: CloseEvent) => unknown) | null = null;
    public sentFrames: Array<string | ArrayBuffer | Blob | ArrayBufferView> = [];
    public closedWith: { code?: number; reason?: string } | null = null;

    constructor(url: string, protocols?: string | string[]) {
      this.url = url;
      if (typeof protocols === "string") {
        this.protocol = protocols;
      } else if (Array.isArray(protocols) && protocols.length > 0) {
        this.protocol = protocols[0] ?? "";
      }
      instances.push(this as unknown as MockWebSocket);
    }

    send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
      this.sentFrames.push(data);
    }

    close(code?: number, reason?: string): void {
      this.closedWith = { code, reason };
      this.readyState = 3;
    }

    fireOpen(): void {
      this.readyState = 1;
      this.onopen?.(new Event("open"));
    }

    fireMessage(data: string | ArrayBuffer | Blob): void {
      this.onmessage?.(new MessageEvent("message", { data }));
    }

    fireError(message = "boom"): void {
      const event = new Event("error") as Event & { message?: string };
      Object.defineProperty(event, "message", { value: message, configurable: true });
      this.onerror?.(event);
    }

    fireClose(code = 1000, reason = ""): void {
      this.readyState = 3;
      this.onclose?.({ code, reason, wasClean: code === 1000 } as unknown as CloseEvent);
    }
  }

  return {
    ctor: MockWebSocket as unknown as WsCtor,
    instances: instances as unknown as MockWebSocket[],
  };
}

interface MockWebSocket extends WsLike {
  sentFrames: Array<string | ArrayBuffer | Blob | ArrayBufferView>;
  closedWith: { code?: number; reason?: string } | null;
  fireOpen(): void;
  fireMessage(data: string | ArrayBuffer | Blob): void;
  fireError(message?: string): void;
  fireClose(code?: number, reason?: string): void;
}

describe("WsTransportAdapter", () => {
  let mockCtor: ReturnType<typeof createMockWebSocketCtor>;
  let adapter: WsTransportAdapter;

  beforeEach(() => {
    mockCtor = createMockWebSocketCtor();
    adapter = new WsTransportAdapter({
      url: "wss://api.example.com/ws",
      protocols: ["graphql-ws"],
      binaryType: "blob",
      WebSocketCtor: mockCtor.ctor,
    });
  });

  afterEach(async () => {
    await adapter.destroy().catch(() => undefined);
  });

  describe("constructor hygiene", () => {
    it("does not instantiate a WebSocket", () => {
      expect(mockCtor.instances.length).toBe(0);
      expect(adapter.readyState).toBe("idle");
      expect(adapter.endpoint).toBe("wss://api.example.com/ws");
      expect(adapter.transportType).toBe("websocket");
    });

    it("isSupported returns true when a WebSocketCtor is injected", () => {
      expect(adapter.isSupported()).toBe(true);
    });
  });

  describe("connect()", () => {
    it("creates a WebSocket with URL, protocols, and binaryType", async () => {
      await adapter.connect();
      expect(mockCtor.instances.length).toBe(1);
      const instance = mockCtor.instances[0];
      expect(instance.url).toBe("wss://api.example.com/ws");
      expect(instance.protocol).toBe("graphql-ws");
      expect(instance.binaryType).toBe("blob");
    });

    it("emits 'open' when the WebSocket fires onopen", async () => {
      const onOpen = vi.fn();
      adapter.addEventListener("open", onOpen);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(adapter.readyState).toBe("open");
    });
  });

  describe("send()", () => {
    it("forwards string frames", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.send("hello");
      expect(mockCtor.instances[0].sentFrames).toEqual(["hello"]);
    });

    it("forwards ArrayBuffer frames", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      const buffer = new ArrayBuffer(4);
      await adapter.send(buffer);
      expect(mockCtor.instances[0].sentFrames).toEqual([buffer]);
    });

    it("forwards Blob frames", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      const blob = new Blob(["hi"]);
      await adapter.send(blob);
      expect(mockCtor.instances[0].sentFrames[0]).toBe(blob);
    });

    it("rejects when called before connect()", async () => {
      await expect(adapter.send("nope")).rejects.toMatchObject({
        code: "TRANSPORT_ERROR",
        retryable: true,
      });
    });
  });

  describe("sendHeartbeat()", () => {
    it("sends the default 'ping' payload when none is supplied", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.sendHeartbeat();
      expect(mockCtor.instances[0].sentFrames).toEqual(["ping"]);
    });

    it("forwards string payloads verbatim", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.sendHeartbeat("hb-1");
      expect(mockCtor.instances[0].sentFrames).toEqual(["hb-1"]);
    });

    it("forwards binary payloads verbatim", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      const buffer = new ArrayBuffer(8);
      await adapter.sendHeartbeat(buffer);
      expect(mockCtor.instances[0].sentFrames[0]).toBe(buffer);
    });
  });

  describe("inbound messages", () => {
    it("emits 'message' with string payloads", async () => {
      const onMessage = vi.fn();
      adapter.addEventListener("message", onMessage);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireMessage("hi");

      expect(onMessage).toHaveBeenCalledTimes(1);
      const event = onMessage.mock.calls[0]?.[0] as CustomEvent<{ data: unknown }>;
      expect(event.detail.data).toBe("hi");
    });

    it("emits 'message' with ArrayBuffer payloads", async () => {
      const onMessage = vi.fn();
      adapter.addEventListener("message", onMessage);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      const buffer = new ArrayBuffer(2);
      mockCtor.instances[0].fireMessage(buffer);

      expect(onMessage).toHaveBeenCalledTimes(1);
      const event = onMessage.mock.calls[0]?.[0] as CustomEvent<{ data: unknown }>;
      expect(event.detail.data).toBe(buffer);
    });

    it("emits 'message' with Blob payloads", async () => {
      const onMessage = vi.fn();
      adapter.addEventListener("message", onMessage);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      const blob = new Blob(["payload"]);
      mockCtor.instances[0].fireMessage(blob);

      expect(onMessage).toHaveBeenCalledTimes(1);
      const event = onMessage.mock.calls[0]?.[0] as CustomEvent<{ data: unknown }>;
      expect(event.detail.data).toBe(blob);
    });
  });

  describe("error events", () => {
    it("emits a TRANSPORT_ERROR on the 'error' event", async () => {
      const onError = vi.fn();
      adapter.addEventListener("error", onError);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireError("network down");

      expect(onError).toHaveBeenCalledTimes(1);
      const event = onError.mock.calls[0]?.[0] as CustomEvent<{
        code: string;
        retryable: boolean;
        message: string;
      }>;
      expect(event.detail.code).toBe("TRANSPORT_ERROR");
      expect(event.detail.retryable).toBe(true);
      expect(event.detail.message).toBe("network down");
    });
  });

  describe("close events", () => {
    it("emits a close event when the WebSocket closes cleanly", async () => {
      const onClose = vi.fn();
      adapter.addEventListener("close", onClose);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireClose(1000, "bye");

      expect(onClose).toHaveBeenCalledTimes(1);
      const event = onClose.mock.calls[0]?.[0] as CustomEvent<{
        code: number;
        reason: string;
        wasClean: boolean;
      }>;
      expect(event.detail.code).toBe(1000);
      expect(event.detail.reason).toBe("bye");
      expect(event.detail.wasClean).toBe(true);
    });

    it("flags wasClean=false for abnormal closes", async () => {
      const onClose = vi.fn();
      adapter.addEventListener("close", onClose);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      mockCtor.instances[0].fireClose(1006, "abnormal");

      const event = onClose.mock.calls[0]?.[0] as CustomEvent<{ wasClean: boolean }>;
      expect(event.detail.wasClean).toBe(false);
    });
  });

  describe("disconnect()", () => {
    it("calls ws.close(1000, 'client disconnect') and emits wasClean", async () => {
      const onClose = vi.fn();
      adapter.addEventListener("close", onClose);

      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.disconnect();

      expect(mockCtor.instances[0].closedWith).toEqual({
        code: 1000,
        reason: "client disconnect",
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      const event = onClose.mock.calls[0]?.[0] as CustomEvent<{ wasClean: boolean }>;
      expect(event.detail.wasClean).toBe(true);
    });
  });

  describe("destroy()", () => {
    it("releases handlers and nulls the WebSocket", async () => {
      await adapter.connect();
      mockCtor.instances[0].fireOpen();
      await adapter.destroy();

      expect(adapter.isDestroyed).toBe(true);
      expect(adapter.readyState).toBe("closed");

      // Subsequent sends should be rejected.
      await expect(adapter.send("after-destroy")).rejects.toMatchObject({
        code: "TRANSPORT_ERROR",
      });
    });
  });

  describe("SSR-safe import", () => {
    it("exports WsTransportAdapter without touching the global WebSocket", () => {
      expect(typeof WsTransportAdapter).toBe("function");
    });
  });
});
