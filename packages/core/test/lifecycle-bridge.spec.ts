import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";
import {
  bridgeControllerDirective,
  bridgeControllerStore,
  syncRecordFromSnapshot,
  wireControllerLifecycle,
} from "../src/lifecycle-bridge";
import { RegistrationError, resetRegistrationTracking } from "../src/registration";
import type { Alpine } from "../src/type";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  directives: Record<string, (...args: never[]) => unknown>;
  cleanups: Array<() => void>;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  directive(name: string, handler: (...args: never[]) => unknown): void;
  cleanup(callback: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    directives: {},
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
    directive(name, handler) {
      alpine.directives[name] = handler;
    },
    cleanup(callback) {
      alpine.cleanups.push(callback);
    },
  };
  return alpine;
}

afterEach(() => {
  resetRegistrationTracking();
});

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

describe("syncRecordFromSnapshot", () => {
  it("copies snapshot keys onto the target record", () => {
    const target: Record<string, unknown> = {};
    syncRecordFromSnapshot(target, { a: 1, b: 2 });
    assert.deepEqual(target, { a: 1, b: 2 });
  });

  it("removes stale keys that are absent from the snapshot", () => {
    const target: Record<string, unknown> = { keep: true, stale: true };
    syncRecordFromSnapshot(target, { keep: true, fresh: 1 });
    assert.deepEqual(target, { keep: true, fresh: 1 });
    assert.equal("stale" in target, false);
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
        packageName: "demo",
        registrationOverride: true,
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

  it("throws RegistrationError when override is disabled and the key is already registered", () => {
    const Alpine = createMockAlpine();
    const controller = createFakeController();
    const store = { value: 0 };

    bridgeControllerStore({
      alpine: Alpine as unknown as Alpine,
      storeKey: "demo",
      store,
      controller,
      packageName: "demo",
      subscribe: (reactiveStore) =>
        controller.on("change", (detail) => {
          reactiveStore.value = detail.value;
        }),
    });

    assert.throws(
      () =>
        bridgeControllerStore({
          alpine: Alpine as unknown as Alpine,
          storeKey: "demo",
          store,
          controller,
          packageName: "demo",
          registrationOverride: false,
          subscribe: (reactiveStore) =>
            controller.on("change", (detail) => {
              reactiveStore.value = detail.value;
            }),
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal((error as unknown as { code: string }).code, "REGISTRATION_COLLISION");
        return true;
      }
    );
  });

  it("silently replaces the prior registration by default", () => {
    const Alpine = createMockAlpine();
    const controller = createFakeController();
    const store = { value: 0 };

    bridgeControllerStore({
      alpine: Alpine as unknown as Alpine,
      storeKey: "demo",
      store,
      controller,
      packageName: "demo",
      subscribe: (reactiveStore) =>
        controller.on("change", (detail) => {
          reactiveStore.value = detail.value;
        }),
    });

    assert.doesNotThrow(() =>
      bridgeControllerStore({
        alpine: Alpine as unknown as Alpine,
        storeKey: "demo",
        store,
        controller,
        packageName: "demo",
        subscribe: (reactiveStore) =>
          controller.on("change", (detail) => {
            reactiveStore.value = detail.value;
          }),
      })
    );
  });
});

describe("bridgeControllerDirective", () => {
  it("registers the directive on the Alpine host", () => {
    const Alpine = createMockAlpine();
    const handler = (): void => undefined;
    bridgeControllerDirective({
      alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
      directiveKey: "demo",
      directive: handler as never,
      packageName: "demo",
    });
    assert.equal(typeof Alpine.directives.demo, "function");
  });

  it("treats the directive as idempotent when re-registered in tests", () => {
    const Alpine = createMockAlpine();
    const handler = (): void => undefined;
    const options = {
      alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
      directiveKey: "demo",
      directive: handler as never,
      packageName: "demo",
    };
    bridgeControllerDirective(options);
    assert.doesNotThrow(() => bridgeControllerDirective(options));
  });

  it("throws RegistrationError when re-registered without override", () => {
    const Alpine = createMockAlpine();
    const handler = (): void => undefined;
    bridgeControllerDirective({
      alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
      directiveKey: "demo",
      directive: handler as never,
      packageName: "demo",
    });
    assert.throws(
      () =>
        bridgeControllerDirective({
          alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
          directiveKey: "demo",
          directive: handler as never,
          packageName: "demo",
          registrationOverride: false,
        }),
      (error: unknown) => {
        assert.ok(error instanceof RegistrationError);
        const registrationError = error as RegistrationError;
        assert.equal(registrationError.registrationName, "demo");
        assert.equal(registrationError.kind, "directive");
        assert.equal((registrationError as unknown as { packageName: string }).packageName, "demo");
        return true;
      }
    );
  });

  it("untracks the directive in Alpine.cleanup so the next registration succeeds", () => {
    const Alpine = createMockAlpine();
    const handler = (): void => undefined;
    const controller = {
      destroyed: false,
      destroy() {
        this.destroyed = true;
      },
    };
    bridgeControllerDirective({
      alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
      directiveKey: "demo",
      directive: handler as never,
      controller: controller as { destroy(): void },
      packageName: "demo",
    });

    assert.equal(Alpine.cleanups.length, 1);
    Alpine.cleanups[0]();
    assert.equal(controller.destroyed, true);

    assert.doesNotThrow(() =>
      bridgeControllerDirective({
        alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
        directiveKey: "demo",
        directive: handler as never,
        packageName: "demo",
        registrationOverride: false,
      })
    );
  });

  it("does not register a cleanup when no controller is provided", () => {
    const Alpine = createMockAlpine();
    bridgeControllerDirective({
      alpine: Alpine as unknown as Parameters<typeof bridgeControllerDirective>[0]["alpine"],
      directiveKey: "demo",
      directive: (() => undefined) as never,
      packageName: "demo",
    });
    assert.equal(Alpine.cleanups.length, 0);
  });
});
