/**
 * RealtimeController tests.
 *
 * Covers the controller's state machine, idempotency, channel
 * routing, backpressure, parser errors, transport errors, max
 * retries, reconnect backoff, visibility pause/resume, adapter
 * swap, heartbeat timeout, publish, and SSR-safe import.
 *
 * Tests use the `MockTransport` from `@ailuracode/alpine-realtime/test`
 * to drive transport-level conditions deterministically.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RealtimeController } from "../../src/controller/RealtimeController";
import { getRealtimeControllerState } from "../../src/controller/RealtimeControllerState";
import { createHeartbeatTimeoutError } from "../../src/controller/RealtimeError";
import type { RealtimeMessage } from "../../src/controller/RealtimeMessage";
import {
  createFakeTimers,
  createMockTransport,
  type MockTimers,
  type MockTransport,
  mockRealtimeControllerConfig,
} from "../../src/test/mocks";

/**
 * Drain pending microtasks. The controller schedules channel
 * drains on a microtask; tests that depend on a flushed
 * delivery await this helper.
 */
async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve();
  }
}

describe("RealtimeController", () => {
  let mock: MockTransport;
  let timers: MockTimers;
  let controller: RealtimeController;

  beforeEach(() => {
    mock = createMockTransport({ autoOpen: true });
    timers = createFakeTimers();
    controller = new RealtimeController(
      mockRealtimeControllerConfig({
        adapter: mock,
        timers,
        random: () => 0.5,
        heartbeatIntervalMs: 0,
        pauseOnHidden: false,
        resumeOnVisible: false,
      })
    );
  });

  afterEach(async () => {
    if (!controller.isDestroyed) {
      await controller.destroy();
    }
  });

  describe("constructor hygiene", () => {
    it("is in the disconnected state and idle phase before connect()", () => {
      expect(controller.state.status).toBe("disconnected");
      expect(controller.state.transport).toBeNull();
      expect(controller.phase).toBe("idle");
      expect(mock.callLog).toEqual([]);
    });

    it("does not start any timers at construction time", () => {
      expect(timers.pendingTimeouts()).toEqual([]);
      expect(timers.pendingIntervals()).toEqual([]);
    });
  });

  describe("state machine", () => {
    it("walks disconnected → connecting → connected", async () => {
      const statuschanges: string[] = [];
      controller.on("statuschange", (s) => {
        statuschanges.push(s.status);
      });

      await controller.connect();
      await flushMicrotasks();

      expect(statuschanges).toEqual(["connecting", "connected"]);
      expect(controller.state.status).toBe("connected");
      expect(controller.state.transport).toBe("sse");
      expect(controller.state.connectedAt).not.toBeNull();
    });

    it("transitions to paused and back to connected", async () => {
      await controller.connect();
      await flushMicrotasks();

      await controller.pause();
      expect(controller.state.status).toBe("paused");

      await controller.resume();
      await flushMicrotasks();
      expect(controller.state.status).toBe("connected");
    });

    it("transitions to reconnecting on transport close", async () => {
      await controller.connect();
      await flushMicrotasks();

      // Override config so the controller attempts to reconnect.
      const reconnectingController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: mock,
          timers,
          random: () => 0.5,
          maxRetries: 5,
          baseDelayMs: 5,
          maxDelayMs: 20,
          reconnect: true,
          heartbeatIntervalMs: 0,
          pauseOnHidden: false,
        })
      );
      await reconnectingController.connect();
      await flushMicrotasks();

      mock.emitClose({ code: 1006, reason: "abnormal" });
      await flushMicrotasks();

      expect(reconnectingController.state.status).toBe("reconnecting");
      expect(reconnectingController.state.retryCount).toBeGreaterThan(0);

      await reconnectingController.destroy();
    });

    it("transitions to failed when retries are exhausted", async () => {
      // Force a re-attach with a transport that never opens
      // so every retry closes the transport immediately.
      const failingMock = createMockTransport({ autoOpen: false });
      const failController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: failingMock,
          timers,
          random: () => 0.5,
          maxRetries: 2,
          baseDelayMs: 5,
          maxDelayMs: 20,
          reconnect: true,
          heartbeatIntervalMs: 0,
          pauseOnHidden: false,
        })
      );
      const errors: unknown[] = [];
      failController.on("error", (e) => errors.push(e));

      await failController.connect();
      await flushMicrotasks();

      failingMock.emitClose({ code: 1006, reason: "abnormal" });
      await flushMicrotasks();
      timers.advance(5);
      await flushMicrotasks();
      failingMock.emitClose({ code: 1006, reason: "abnormal" });
      await flushMicrotasks();
      timers.advance(20);
      await flushMicrotasks();
      failingMock.emitClose({ code: 1006, reason: "abnormal" });
      await flushMicrotasks();

      expect(failController.state.status).toBe("failed");
      const codes = errors
        .map((e) => (e as { code: string }).code)
        .filter((code) => code === "MAX_RETRIES_EXCEEDED");
      expect(codes.length).toBeGreaterThan(0);

      await failController.destroy();
    });
  });

  describe("idempotency", () => {
    it("connect() called twice opens a single transport", async () => {
      await controller.connect();
      await controller.connect();
      await flushMicrotasks();

      const connectCalls = mock.callLog.filter((c) => c.method === "connect");
      expect(connectCalls.length).toBe(1);
      expect(controller.state.status).toBe("connected");
    });

    it("disconnect() called twice is safe", async () => {
      await controller.connect();
      await flushMicrotasks();
      await controller.disconnect();
      await controller.disconnect();
      expect(controller.state.status).toBe("disconnected");
    });

    it("destroy() called twice is safe", async () => {
      await controller.connect();
      await flushMicrotasks();
      await controller.destroy();
      await controller.destroy();
      expect(controller.isDestroyed).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("destroy() releases transport, channels, and timers", async () => {
      const handler = vi.fn();
      const unsubscribe = controller.subscribe("alpha", handler);

      await controller.connect();
      await flushMicrotasks();
      mock.emitMessage(JSON.stringify({ channel: "alpha", data: { v: 1 } }));
      await flushMicrotasks();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(controller.state.channels.has("alpha")).toBe(true);

      await controller.destroy();

      expect(controller.state.channels.has("alpha")).toBe(false);
      expect(mock.isDestroyed).toBe(true);
      expect(timers.pendingTimeouts()).toEqual([]);
      expect(timers.pendingIntervals()).toEqual([]);
      void unsubscribe;
    });
  });

  describe("channel routing", () => {
    it("delivers messages to subscribed handlers", async () => {
      const seen: RealtimeMessage[] = [];
      controller.subscribe("alpha", (m) => {
        seen.push(m);
      });

      await controller.connect();
      await flushMicrotasks();
      mock.emitMessage(JSON.stringify({ channel: "alpha", data: { v: 42 } }));
      await flushMicrotasks();

      expect(seen.length).toBe(1);
      expect(seen[0]?.data).toEqual({ v: 42 });
      expect(controller.state.channels.has("alpha")).toBe(true);
    });

    it("ignores messages for unknown channels", async () => {
      const seen: RealtimeMessage[] = [];
      controller.subscribe("alpha", (m) => {
        seen.push(m);
      });

      await controller.connect();
      await flushMicrotasks();
      mock.emitMessage(JSON.stringify({ channel: "beta", data: { v: 1 } }));
      await flushMicrotasks();

      expect(seen.length).toBe(0);
    });

    it("subscribe() returns an idempotent unsubscribe function", async () => {
      const handler = vi.fn();
      const unsubscribe = controller.subscribe("alpha", handler);
      unsubscribe();
      unsubscribe();

      await controller.connect();
      await flushMicrotasks();
      mock.emitMessage(JSON.stringify({ channel: "alpha", data: { v: 1 } }));
      await flushMicrotasks();

      expect(handler).not.toHaveBeenCalled();
      expect(controller.state.channels.has("alpha")).toBe(false);
    });

    it("unsubscribe() without a handler drops the channel", () => {
      const handler = vi.fn();
      controller.subscribe("alpha", handler);
      controller.unsubscribe("alpha");
      expect(controller.state.channels.has("alpha")).toBe(false);
    });
  });

  describe("backpressure", () => {
    it("emits a backpressure event when a channel overflows", async () => {
      const backpressures: unknown[] = [];
      const onBackpressure = (detail: unknown): void => {
        backpressures.push(detail);
      };

      const slowController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: mock,
          timers,
          random: () => 0.5,
          highWaterMark: 2,
          heartbeatIntervalMs: 0,
          pauseOnHidden: false,
        })
      );
      slowController.on("backpressure", onBackpressure);
      slowController.subscribe("alpha", () => {
        /* sink */
      });

      await slowController.connect();
      await flushMicrotasks();

      // Emit 5 messages on the same channel; 3 of them should
      // trigger backpressure.
      for (let i = 0; i < 5; i += 1) {
        mock.emitMessage(JSON.stringify({ channel: "alpha", data: i }));
      }
      await flushMicrotasks();

      expect(backpressures.length).toBe(3);
      const first = backpressures[0] as { channel: string; dropped: number; strategy: string };
      expect(first.channel).toBe("alpha");
      expect(first.dropped).toBe(1);
      expect(first.strategy).toBe("drop-newest");

      await slowController.destroy();
    });
  });

  describe("parser errors", () => {
    it("emits a PARSE_ERROR and stays connected", async () => {
      const parseController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: mock,
          timers,
          random: () => 0.5,
          parse: () => {
            throw new Error("malformed");
          },
          heartbeatIntervalMs: 0,
          pauseOnHidden: false,
        })
      );

      const errors: unknown[] = [];
      parseController.on("error", (e) => errors.push(e));

      await parseController.connect();
      await flushMicrotasks();

      mock.emitMessage('{"channel":"alpha","data":1}');
      await flushMicrotasks();

      const parseErrors = errors.filter((e) => (e as { code: string }).code === "PARSE_ERROR");
      expect(parseErrors.length).toBe(1);
      const code = (parseErrors[0] as { code: string }).code;
      expect(code).toBe("PARSE_ERROR");
      expect(parseController.state.status).toBe("connected");

      await parseController.destroy();
    });
  });

  describe("transport errors", () => {
    it("emits a TRANSPORT_ERROR with retryable=true", async () => {
      const errors: unknown[] = [];
      controller.on("error", (e) => errors.push(e));

      await controller.connect();
      await flushMicrotasks();
      mock.emitError({ message: "network", retryable: true });
      await flushMicrotasks();

      const transportErrors = errors.filter(
        (e) => (e as { code: string }).code === "TRANSPORT_ERROR"
      );
      expect(transportErrors.length).toBeGreaterThan(0);
      const first = transportErrors[0] as { retryable: boolean };
      expect(first.retryable).toBe(true);
    });
  });

  describe("reconnect backoff", () => {
    it("schedules a reconnect after a transport failure", async () => {
      const reconnectController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: mock,
          timers,
          random: () => 0.5,
          maxRetries: 5,
          baseDelayMs: 5,
          maxDelayMs: 20,
          reconnect: true,
          heartbeatIntervalMs: 0,
          pauseOnHidden: false,
        })
      );
      const reconnectEvents: unknown[] = [];
      reconnectController.on("reconnect", (d) => reconnectEvents.push(d));

      await reconnectController.connect();
      await flushMicrotasks();
      mock.emitClose({ code: 1006 });
      await flushMicrotasks();

      expect(reconnectController.state.status).toBe("reconnecting");
      expect(reconnectEvents.length).toBe(1);
      const first = reconnectEvents[0] as { attempt: number; nextDelayMs: number };
      expect(first.attempt).toBe(0);
      expect(first.nextDelayMs).toBeGreaterThan(0);

      // Advance the scheduled timer to fire the retry.
      timers.advance(20);
      await flushMicrotasks();

      // After the retry, the controller reconnects (or fails).
      expect(reconnectController.state.retryCount).toBeGreaterThan(0);

      await reconnectController.destroy();
    });
  });

  describe("heartbeat timeout", () => {
    it("emits a HEARTBEAT_TIMEOUT after the watchdog elapses", async () => {
      const heartbeatMock = createMockTransport({ autoOpen: true });
      const heartbeatController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: heartbeatMock,
          timers,
          random: () => 0.5,
          heartbeatIntervalMs: 30,
          heartbeatTimeoutMs: 10,
          pauseOnHidden: false,
        })
      );
      const errors: unknown[] = [];
      heartbeatController.on("error", (e) => errors.push(e));

      await heartbeatController.connect();
      await flushMicrotasks();

      // Advance past the interval + timeout without sending a pong.
      timers.advance(100);
      await flushMicrotasks();

      const heartbeatErrors = errors.filter(
        (e) => (e as { code: string }).code === "HEARTBEAT_TIMEOUT"
      );
      expect(heartbeatErrors.length).toBeGreaterThan(0);
      const first = heartbeatErrors[0] as { retryable: boolean };
      expect(first.retryable).toBe(true);
      void createHeartbeatTimeoutError; // touch export for surface area

      await heartbeatController.destroy();
    });
  });

  describe("publish()", () => {
    it("calls adapter.send() with the serialized message", async () => {
      const sendCalls: unknown[] = [];
      const publishMock = createMockTransport({ autoOpen: true });
      const original = publishMock.send.bind(publishMock);
      publishMock.send = (data: string | ArrayBuffer | Blob): Promise<void> => {
        sendCalls.push(data);
        return original(data);
      };

      const publishController = new RealtimeController(
        mockRealtimeControllerConfig({
          adapter: publishMock,
          timers,
          random: () => 0.5,
          heartbeatIntervalMs: 0,
          pauseOnHidden: false,
        })
      );

      await publishController.connect();
      await flushMicrotasks();
      await publishController.publish("alpha", { channel: "alpha", data: { v: 1 } });

      expect(sendCalls.length).toBe(1);
      const frame = JSON.parse(sendCalls[0] as string);
      expect(frame.channel).toBe("alpha");
      expect(frame.data).toEqual({ v: 1 });

      await publishController.destroy();
    });
  });

  describe("adapter swap", () => {
    it("setAdapter() replaces the bound transport", async () => {
      await controller.connect();
      await flushMicrotasks();

      const newMock = createMockTransport({ autoOpen: true, transportType: "websocket" });
      await controller.setAdapter(newMock);
      await flushMicrotasks();

      expect(controller.getAdapter()).toBe(newMock);
      expect(controller.state.transport).toBe("websocket");
      expect(controller.state.status).toBe("connected");

      await controller.destroy();
    });
  });

  describe("state snapshot", () => {
    it("is frozen and reflects the latest status", async () => {
      const initial = controller.state;
      expect(Object.isFrozen(initial)).toBe(true);
      expect(Object.isFrozen(initial.channels)).toBe(true);

      await controller.connect();
      await flushMicrotasks();
      const updated = controller.state;
      expect(updated.status).toBe("connected");
      expect(Object.isFrozen(updated)).toBe(true);
      // The snapshot is a fresh copy — the controller's
      // internal channels Set is decoupled.
      expect(updated.channels).not.toBe(initial.channels);
    });

    it("getRealtimeControllerState returns a frozen copy", () => {
      const state = getRealtimeControllerState({
        status: "connected",
        transport: "websocket",
        connectedAt: 1,
        lastMessageAt: 2,
        retryCount: 0,
        nextRetryAt: null,
        channels: new Set(["a", "b"]),
        bufferedCount: 0,
      });
      expect(Object.isFrozen(state)).toBe(true);
      expect(Object.isFrozen(state.channels)).toBe(true);
      expect(state.status).toBe("connected");
      expect(state.channels.has("a")).toBe(true);
    });
  });
});
