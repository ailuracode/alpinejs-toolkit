/**
 * TransportAdapterFactory tests.
 *
 * Coverage:
 *
 * - `createSseTransport` returns an `SseTransportAdapter`.
 * - `createWsTransport` returns a `WsTransportAdapter`.
 * - `createAutoTransport` probes WS first and falls back to SSE
 *   when the WS constructor never fires `'open'`.
 * - `createAutoTransport` returns the WS adapter on success.
 * - `createBroadcastChannelTransport` throws
 *   `ADAPTER_ERROR` (v0.2.0 seam).
 * - All factories are SSR-safe (callable in Node without
 *   errors).
 */
import { describe, expect, it } from "vitest";
import type {
  SseEventSourceCtor,
  SseEventSourceLike,
} from "../../src/adapters/SseTransportAdapter";
import { SseTransportAdapter } from "../../src/adapters/SseTransportAdapter";
import {
  createAutoTransport,
  createBroadcastChannelTransport,
  createSseTransport,
  createWsTransport,
} from "../../src/adapters/TransportAdapterFactory";
import type { WsCtor, WsLike } from "../../src/adapters/WsTransportAdapter";
import { WsTransportAdapter } from "../../src/adapters/WsTransportAdapter";

function createMockWebSocketCtor(opts: { openImmediately?: boolean } = {}): {
  ctor: WsCtor;
  instances: MockWebSocket[];
} {
  const instances: MockWebSocket[] = [];
  const openImmediately = opts.openImmediately ?? false;

  class MockWebSocket implements WsLike {
    public url: string;
    public protocol: string = "";
    public binaryType: BinaryType = "arraybuffer";
    public readyState = 0;
    public onopen: ((this: WsLike, ev: Event) => unknown) | null = null;
    public onmessage: ((this: WsLike, ev: MessageEvent) => unknown) | null = null;
    public onerror: ((this: WsLike, ev: Event) => unknown) | null = null;
    public onclose: ((this: WsLike, ev: CloseEvent) => unknown) | null = null;

    constructor(url: string, _protocols?: string | string[]) {
      this.url = url;
      instances.push(this as unknown as MockWebSocket);
      if (openImmediately) {
        // Fire asynchronously so listeners are wired up first.
        queueMicrotask(() => {
          this.readyState = 1;
          this.onopen?.(new Event("open"));
        });
      }
    }

    send(): void {
      /* no-op */
    }
    close(code?: number, reason?: string): void {
      this.readyState = 3;
      this.onclose?.({
        code: code ?? 1000,
        reason: reason ?? "",
        wasClean: code === 1000,
      } as unknown as CloseEvent);
    }
    addEventListener(): void {
      /* no-op */
    }
    removeEventListener(): void {
      /* no-op */
    }
  }

  return {
    ctor: MockWebSocket as unknown as WsCtor,
    instances: instances as unknown as MockWebSocket[],
  };
}

function createMockEventSourceCtor(): {
  ctor: SseEventSourceCtor;
  instances: MockSseEventSource[];
} {
  const instances: MockSseEventSource[] = [];

  class MockEventSource implements SseEventSourceLike {
    public url: string;
    public withCredentials: boolean = false;
    public readyState = 0;
    public onopen: ((this: SseEventSourceLike, ev: Event) => unknown) | null = null;
    public onmessage: ((this: SseEventSourceLike, ev: MessageEvent) => unknown) | null = null;
    public onerror: ((this: SseEventSourceLike, ev: Event) => unknown) | null = null;
    constructor(url: string) {
      this.url = url;
      instances.push(this as unknown as MockSseEventSource);
    }
    addEventListener(): void {
      /* no-op */
    }
    removeEventListener(): void {
      /* no-op */
    }
    close(): void {
      this.readyState = 2;
    }
  }

  return {
    ctor: MockEventSource as unknown as SseEventSourceCtor,
    instances: instances as unknown as MockSseEventSource[],
  };
}

interface MockWebSocket extends WsLike {
  /* extra test fields can land here */
}

interface MockSseEventSource extends SseEventSourceLike {
  /* extra test fields can land here */
}

describe("TransportAdapterFactory", () => {
  describe("createSseTransport", () => {
    it("returns an SseTransportAdapter", () => {
      const adapter = createSseTransport({ url: "/events" });
      expect(adapter).toBeInstanceOf(SseTransportAdapter);
      expect(adapter.endpoint).toBe("/events");
      expect(adapter.transportType).toBe("sse");
      void adapter.destroy();
    });
  });

  describe("createWsTransport", () => {
    it("returns a WsTransportAdapter", () => {
      const adapter = createWsTransport({ url: "wss://api.example.com/ws" });
      expect(adapter).toBeInstanceOf(WsTransportAdapter);
      expect(adapter.endpoint).toBe("wss://api.example.com/ws");
      expect(adapter.transportType).toBe("websocket");
      void adapter.destroy();
    });
  });

  describe("createAutoTransport", () => {
    it("returns the WebSocket adapter when WS opens successfully", async () => {
      const ws = createMockWebSocketCtor({ openImmediately: true });
      const sse = createMockEventSourceCtor();

      const adapter = await createAutoTransport({
        url: "wss://api.example.com/ws",
        WebSocketCtor: ws.ctor,
        EventSourceCtor: sse.ctor,
      });

      expect(adapter).toBeInstanceOf(WsTransportAdapter);
      expect(sse.instances.length).toBe(0);
      await adapter.destroy();
    });

    it("falls back to SSE when WS does not open within the fallback window", async () => {
      const ws = createMockWebSocketCtor({ openImmediately: false });
      const sse = createMockEventSourceCtor();

      const adapter = await createAutoTransport({
        url: "wss://api.example.com/ws",
        WebSocketCtor: ws.ctor,
        EventSourceCtor: sse.ctor,
      });

      expect(adapter).toBeInstanceOf(SseTransportAdapter);
      expect(sse.instances.length).toBe(1);
      await adapter.destroy();
    });
  });

  describe("createBroadcastChannelTransport", () => {
    it("throws ADAPTER_ERROR — not implemented in v0.1.0", () => {
      expect(() => createBroadcastChannelTransport("foo")).toThrowError(
        expect.objectContaining({
          name: "RealtimeError",
          code: "ADAPTER_ERROR",
          retryable: false,
        })
      );
    });
  });

  describe("SSR-safe callability", () => {
    it("createSseTransport is callable without errors in Node", () => {
      const adapter = createSseTransport({ url: "/events" });
      expect(adapter.endpoint).toBe("/events");
      void adapter.destroy();
    });

    it("createWsTransport is callable without errors in Node", () => {
      const adapter = createWsTransport({ url: "wss://api.example.com/ws" });
      expect(adapter.endpoint).toBe("wss://api.example.com/ws");
      void adapter.destroy();
    });

    it("createBroadcastChannelTransport throws immediately in Node", () => {
      expect(() => createBroadcastChannelTransport("x")).toThrow();
    });
  });
});
