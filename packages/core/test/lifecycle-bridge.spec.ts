/**
 * Lifecycle bridge — Alpine cleanup, reactive store binding, snapshot sync.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AlpineCleanupHost,
  type AlpineStoreHost,
  bindControllerStore,
  registerAlpineCleanup,
  syncRecordFromSnapshot,
} from "../src/alpine/lifecycle-bridge.js";
import { BaseController } from "../src/controller.js";

interface MockAlpine<TStore extends object> {
  stores: Record<string, TStore>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  store(name: string, value?: TStore): TStore;
  magic(name: string, factory: () => unknown): void;
  cleanup(callback: () => void): void;
}

interface DemoDetail {
  value: number;
}

interface DemoStore {
  value: number;
}

class DemoController extends BaseController<{ change: DemoDetail }> {
  #value = 0;

  get value(): number {
    return this.#value;
  }

  setValue(next: number): void {
    this.#value = next;
    this.emit("change", { value: next });
  }
}

function asAlpineHost<TStore extends object>(
  alpine: MockAlpine<TStore>
): AlpineStoreHost<TStore> & AlpineCleanupHost {
  return alpine as unknown as AlpineStoreHost<TStore> & AlpineCleanupHost;
}

function createMockAlpine<TStore extends object>(): MockAlpine<TStore> {
  const alpine: MockAlpine<TStore> = {
    stores: {},
    magics: {},
    cleanups: [],
    store(name, value?) {
      if (value === undefined) {
        return alpine.stores[name];
      }
      alpine.stores[name] = value;
      return value;
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

describe("registerAlpineCleanup", () => {
  it("registers teardown callbacks in order when Alpine.cleanup exists", () => {
    const alpine = createMockAlpine<DemoStore>();
    const order: string[] = [];
    registerAlpineCleanup(
      alpine,
      () => {
        order.push("first");
      },
      () => {
        order.push("second");
      }
    );
    expect(alpine.cleanups).toHaveLength(1);
    alpine.cleanups[0]?.();
    expect(order).toEqual(["first", "second"]);
  });

  it("is a no-op when Alpine.cleanup is missing", () => {
    const alpine: { cleanup?: (callback: () => void) => void } = {};
    expect(() => registerAlpineCleanup(alpine, () => undefined)).not.toThrow();
  });

  it("allows idempotent repeated cleanup invocations", () => {
    const alpine = createMockAlpine<DemoStore>();
    const teardown = vi.fn();
    registerAlpineCleanup(alpine, teardown);
    alpine.cleanups[0]?.();
    alpine.cleanups[0]?.();
    expect(teardown).toHaveBeenCalledTimes(2);
  });
});

describe("syncRecordFromSnapshot", () => {
  it("copies snapshot keys onto the target record", () => {
    const target: Record<string, unknown> = {};
    syncRecordFromSnapshot(target, { a: 1, b: 2 });
    expect(target).toEqual({ a: 1, b: 2 });
  });

  it("removes stale keys that are absent from the snapshot", () => {
    const target: Record<string, unknown> = { keep: true, stale: true };
    syncRecordFromSnapshot(target, { keep: true, fresh: 1 });
    expect(target).toEqual({ keep: true, fresh: 1 });
    expect("stale" in target).toBe(false);
  });
});

describe("bindControllerStore", () => {
  let alpine: MockAlpine<DemoStore>;
  let controller: DemoController;

  beforeEach(() => {
    alpine = createMockAlpine<DemoStore>();
    controller = new DemoController("demo");
    controller.mount();
  });

  afterEach(() => {
    controller.destroy();
  });

  it("registers the store, magic, and a single cleanup callback", () => {
    const { reactiveStore } = bindControllerStore({
      alpine: asAlpineHost(alpine),
      storeKey: "demo",
      store: { value: 0 },
      controller,
      sync: (proxy, detail) => {
        proxy.value = detail.value;
      },
    });

    expect(alpine.stores.demo).toBeDefined();
    expect(alpine.magics.demo).toBeDefined();
    expect(alpine.magics.demo?.()).toBe(reactiveStore);
    expect(alpine.cleanups).toHaveLength(1);
  });

  it("mirrors controller changes onto the reactive proxy", () => {
    const { reactiveStore } = bindControllerStore({
      alpine: asAlpineHost(alpine),
      storeKey: "demo",
      store: { value: 0 },
      controller,
      sync: (proxy, detail) => {
        proxy.value = detail.value;
      },
    });

    controller.setValue(7);
    expect(reactiveStore.value).toBe(7);
  });

  it("runs beforeDestroy, unsubscribe, and destroy in order on cleanup", () => {
    const order: string[] = [];
    const bridgeController = {
      on(_event: "change", _listener: (detail: DemoDetail) => void) {
        return () => {
          order.push("unsubscribe");
        };
      },
      destroy() {
        order.push("destroy");
      },
    };

    bindControllerStore({
      alpine: asAlpineHost(alpine),
      storeKey: "demo",
      store: { value: 0 },
      controller: bridgeController,
      sync: () => undefined,
      beforeDestroy: [
        () => {
          order.push("beforeDestroy");
        },
      ],
    });

    alpine.cleanups[0]?.();
    expect(order).toEqual(["beforeDestroy", "unsubscribe", "destroy"]);
  });

  it("supports custom magic factories", () => {
    bindControllerStore({
      alpine: asAlpineHost(alpine),
      storeKey: "demo",
      store: { value: 0 },
      controller,
      sync: (proxy, detail) => {
        proxy.value = detail.value;
      },
      magic: {
        name: "custom",
        factory: (store) => ({ doubled: store.value * 2 }),
      },
    });

    expect(alpine.magics.custom).toBeDefined();
    expect(alpine.magics.custom?.()).toEqual({ doubled: 0 });
  });

  it("tears down prior subscriptions on re-registration (HMR-like)", () => {
    const first = bindControllerStore({
      alpine: asAlpineHost(alpine),
      storeKey: "demo",
      store: { value: 0 },
      controller,
      sync: (proxy, detail) => {
        proxy.value = detail.value;
      },
    });

    alpine.cleanups[0]?.();

    const secondController = new DemoController("demo-2");
    secondController.mount();
    const second = bindControllerStore({
      alpine: asAlpineHost(alpine),
      storeKey: "demo",
      store: { value: 0 },
      controller: secondController,
      sync: (proxy, detail) => {
        proxy.value = detail.value;
      },
    });

    secondController.setValue(3);
    expect(second.reactiveStore.value).toBe(3);
    expect(() => first.unsubscribe()).not.toThrow();
    secondController.destroy();
  });
});
