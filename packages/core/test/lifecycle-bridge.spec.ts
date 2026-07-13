/**
 * Tests for the controller-backed Alpine lifecycle bridge.
 *
 * Locks cleanup order, subscription ownership, and HMR-like
 * re-registration behavior without booting a full Alpine runtime.
 */
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { Alpine } from "../src/core/type";
import {
  bridgeControllerStore,
  registerReactiveStore,
  registerStoreMagic,
  wireControllerLifecycle,
} from "../src/lifecycle-bridge";

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

interface FakeController {
  listeners: Array<(detail: { value: number }) => void>;
  destroyed: boolean;
  on(event: "change", listener: (detail: { value: number }) => void): () => void;
  destroy(): void;
}

function createFakeController(): FakeController {
  const controller: FakeController = {
    listeners: [],
    destroyed: false,
    on(_event, listener) {
      controller.listeners.push(listener);
      return () => {
        const index = controller.listeners.indexOf(listener);
        if (index >= 0) {
          controller.listeners.splice(index, 1);
        }
      };
    },
    destroy() {
      controller.destroyed = true;
      controller.listeners.length = 0;
    },
  };
  return controller;
}

describe("registerReactiveStore", () => {
  it("registers the store and returns the reactive proxy", () => {
    const Alpine = createMockAlpine();
    const store = { value: 1 };
    const { reactiveStore } = registerReactiveStore(Alpine as unknown as Alpine, "demo", store);
    assert.equal(reactiveStore, Alpine.stores.demo);
    assert.equal(reactiveStore.value, 1);
  });
});

describe("registerStoreMagic", () => {
  it("returns the same reference on repeated magic access", () => {
    const Alpine = createMockAlpine();
    const store = { value: 1 };
    registerStoreMagic(Alpine as unknown as Alpine, "demo", () => store);
    const first = Alpine.magics.demo();
    const second = Alpine.magics.demo();
    assert.equal(first, second);
  });
});

describe("wireControllerLifecycle", () => {
  it("runs subscription teardown before controller destroy", () => {
    const Alpine = createMockAlpine();
    const controller = createFakeController();
    const order: string[] = [];
    const unsubscribe = () => {
      order.push("unsubscribe");
    };

    wireControllerLifecycle(Alpine as unknown as Alpine, controller, {
      subscriptions: [unsubscribe],
      onCleanup: [
        () => {
          order.push("extra");
        },
      ],
    });

    assert.equal(Alpine.cleanups.length, 1);
    Alpine.cleanups[0]();

    assert.deepEqual(order, ["unsubscribe", "extra"]);
    assert.equal(controller.destroyed, true);
  });

  it("is a no-op when Alpine.cleanup is missing", () => {
    const Alpine = createMockAlpine();
    const alpineWithoutCleanup = { ...Alpine, cleanup: undefined };
    const controller = createFakeController();
    let unsubscribed = false;

    wireControllerLifecycle(alpineWithoutCleanup as unknown as Alpine, controller, {
      subscriptions: [
        () => {
          unsubscribed = true;
        },
      ],
    });

    assert.equal(controller.destroyed, false);
    assert.equal(unsubscribed, false);
  });
});

describe("bridgeControllerStore", () => {
  it("registers store, magic, and cleanup", () => {
    const Alpine = createMockAlpine();
    const controller = createFakeController();
    const store = { value: 0 };

    bridgeControllerStore({
      alpine: Alpine as unknown as Alpine,
      storeKey: "demo",
      store,
      controller,
      subscribe: (reactiveStore) =>
        controller.on("change", (detail) => {
          reactiveStore.value = detail.value;
        }),
    });

    assert.ok(Alpine.stores.demo);
    assert.ok(Alpine.magics.demo);
    assert.equal(Alpine.cleanups.length, 1);
  });

  it("detaches subscriptions on cleanup before destroying the controller", () => {
    const Alpine = createMockAlpine();
    const controller = createFakeController();
    const store = { value: 0 };

    bridgeControllerStore({
      alpine: Alpine as unknown as Alpine,
      storeKey: "demo",
      store,
      controller,
      subscribe: (reactiveStore) =>
        controller.on("change", (detail) => {
          reactiveStore.value = detail.value;
        }),
    });

    assert.equal(controller.listeners.length, 1);
    Alpine.cleanups[0]();
    assert.equal(controller.listeners.length, 0);
    assert.equal(controller.destroyed, true);
  });

  it("supports HMR-like re-registration without listener leaks", () => {
    const Alpine = createMockAlpine();
    const controller = createFakeController();
    const store = { value: 0 };

    const bridge = () =>
      bridgeControllerStore({
        alpine: Alpine as unknown as Alpine,
        storeKey: "demo",
        store,
        controller,
        subscribe: (reactiveStore) =>
          controller.on("change", (detail) => {
            reactiveStore.value = detail.value;
          }),
      });

    bridge();
    assert.equal(controller.listeners.length, 1);

    Alpine.cleanups[0]();
    assert.equal(controller.listeners.length, 0);

    bridge();
    assert.equal(controller.listeners.length, 1);
    assert.equal(Alpine.cleanups.length, 2);
  });
});
