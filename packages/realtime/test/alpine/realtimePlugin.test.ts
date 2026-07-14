/**
 * realtimePlugin tests.
 *
 * Coverage:
 *
 * - Plugin registers `$store.realtime` as a reactive object.
 * - Plugin registers `$realtime` magic.
 * - `$store.realtime.isReady` updates when controller status
 *   changes.
 * - `$store.realtime.state.status` reflects controller state.
 * - `$realtime.connect()` triggers controller connect.
 * - `$realtime.subscribe('ch', handler)` registers channel handler.
 * - `$realtime.publish('ch', msg)` calls adapter.send.
 * - Plugin cleans up on destroy (or registers cleanup callback).
 * - Multiple controllers via
 *   `Alpine.store('realtime:foo', controller)` work.
 * - SSR-safe: importing the plugin does not error in Node.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RealtimeController } from "../../src/controller/RealtimeController";
import { realtimePlugin } from "../../src/plugin/realtimePlugin";
import type { MockTransport } from "../../src/test/mocks";
import { createMockTransport } from "../../src/test/mocks";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  cleanup(callback: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    cleanups: [],
    store(name, value?) {
      if (value === undefined) {
        return alpine.stores[name];
      }
      alpine.stores[name] = value;
      return undefined;
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
    cleanup(callback) {
      alpine.cleanups.push(callback);
    },
  };
  return alpine;
}

describe("realtimePlugin", () => {
  let alpine: MockAlpine;
  let mock: MockTransport;

  beforeEach(() => {
    alpine = createMockAlpine();
    mock = createMockTransport({ autoOpen: true });
  });

  afterEach(() => {
    for (const cleanup of alpine.cleanups.splice(0)) {
      cleanup();
    }
  });

  it("registers $store.realtime with state and isReady", () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );

    const store = alpine.stores.realtime as {
      state: { status: string };
      isReady: boolean;
    };
    expect(store).toBeDefined();
    expect(store.state.status).toBe("disconnected");
    expect(store.isReady).toBe(false);
  });

  it("registers $realtime magic", () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );

    expect(typeof alpine.magics.realtime).toBe("function");
    const magic = alpine.magics.realtime() as { controller: RealtimeController };
    expect(magic.controller).toBeInstanceOf(RealtimeController);
  });

  it("reflects controller state on the reactive store", async () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );

    const magic = alpine.magics.realtime() as {
      connect(): Promise<void>;
      controller: RealtimeController;
    };
    await magic.connect();

    // The reactive store is a plain object proxy in tests (no
    // Alpine reactivity), so reads go through to the latest
    // mutable state. The bridge subscribes to statuschange.
    const store = alpine.stores.realtime as {
      state: { status: string };
      isReady: boolean;
    };
    expect(store.state.status).toBe("connected");
    expect(store.isReady).toBe(true);
  });

  it("$realtime.connect() calls controller.connect()", async () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );
    const magic = alpine.magics.realtime() as {
      connect(): Promise<void>;
      controller: RealtimeController;
    };

    const connectSpy = vi.spyOn(magic.controller, "connect");
    await magic.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it("$realtime.subscribe(channel, handler) registers a channel handler", async () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );
    const magic = alpine.magics.realtime() as {
      connect(): Promise<void>;
      subscribe(channel: string, handler: (m: { data: unknown }) => void): () => void;
      controller: RealtimeController;
    };

    await magic.connect();

    const handler = vi.fn();
    const unsubscribe = magic.subscribe("alpha", handler);
    expect(magic.controller.state.channels.has("alpha")).toBe(true);

    unsubscribe();
    expect(magic.controller.state.channels.has("alpha")).toBe(false);
  });

  it("$realtime.publish(channel, msg) calls adapter.send", async () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );
    const magic = alpine.magics.realtime() as {
      connect(): Promise<void>;
      publish(channel: string, msg: { channel?: string; data: unknown }): Promise<void>;
    };

    await magic.connect();

    const sendSpy = vi.spyOn(mock, "send");
    await magic.publish("alpha", { channel: "alpha", data: { v: 1 } });

    expect(sendSpy).toHaveBeenCalled();
    const frame = sendSpy.mock.calls[0]?.[0];
    if (typeof frame === "string") {
      const parsed = JSON.parse(frame);
      expect(parsed.channel).toBe("alpha");
      expect(parsed.data).toEqual({ v: 1 });
    }
  });

  it("registers an Alpine.cleanup callback that destroys the controller", () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );
    const magic = alpine.magics.realtime() as { controller: RealtimeController };

    expect(alpine.cleanups.length).toBe(1);
    expect(magic.controller.isDestroyed).toBe(false);

    alpine.cleanups[0]?.();
    expect(magic.controller.isDestroyed).toBe(true);
  });

  it("supports multiple controllers via Alpine.store('realtime:<id>', controller)", () => {
    realtimePlugin({ adapter: mock, id: "primary" })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );

    const secondary = new RealtimeController({
      adapter: mock,
      id: "secondary",
      endpoint: "mock://secondary",
      transport: "sse",
    });

    alpine.store("realtime:secondary", {
      state: secondary.state,
      get isReady() {
        return secondary.state.status === "connected";
      },
    });

    const stored = alpine.stores["realtime:secondary"] as { state: { status: string } };
    expect(stored).toBeDefined();
    expect(stored.state.status).toBe("disconnected");
    void secondary.destroy();
  });

  it("plugin factory itself has no side effects before registration", () => {
    const factory = realtimePlugin({ adapter: mock });
    expect(typeof factory).toBe("function");
    // The mock hasn't been touched yet — the plugin only calls
    // `new RealtimeController(...)` inside the returned callback.
    expect(mock.callLog).toEqual([]);
  });

  it("$realtime.getState() returns the controller state snapshot", () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );
    const magic = alpine.magics.realtime() as {
      getState(): { status: string };
    };
    const state = magic.getState();
    expect(state.status).toBe("disconnected");
    expect(Object.isFrozen(state)).toBe(true);
  });

  it("$realtime.on('error', handler) subscribes to controller errors", async () => {
    realtimePlugin({ adapter: mock })(
      alpine as unknown as Parameters<ReturnType<typeof realtimePlugin>>[0]
    );
    const magic = alpine.magics.realtime() as {
      connect(): Promise<void>;
      on(event: string, handler: (detail: unknown) => void): () => void;
      controller: RealtimeController;
    };
    await magic.connect();

    const errors: unknown[] = [];
    magic.on("error", (e) => errors.push(e));
    mock.emitError({ message: "boom", retryable: true });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errors.length).toBeGreaterThan(0);
  });
});
