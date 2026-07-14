/**
 * Scroll plugin spec — Alpine integration: store registration,
 * magic exposure, reactivity, idempotency, cleanup.
 *
 * Mirrors the pattern from `packages/sidebar/test/plugin.spec.ts`:
 * the plugin is a factory function, the mock Alpine matches the
 * real runtime shape, and every assertion runs against the public
 * `scrollPlugin` / `createScrollStore` surface.
 */

import { clearAllSingletons } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScroll, ScrollController, type ScrollStore, scrollPlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    cleanups: [],
    plugin(cb) {
      cb(alpine);
    },
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
    cleanup(cb) {
      alpine.cleanups.push(cb);
    },
  };
  return alpine;
}

describe("scrollPlugin — registration", () => {
  it("registers the scroll store and the $scroll magic", () => {
    const Alpine = createMockAlpine();
    scrollPlugin({ id: "plugin-1" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.scroll).toBeDefined();
    expect(Alpine.magics.scroll).toBeDefined();
  });

  it("registers a single Alpine cleanup callback when Alpine.cleanup is available", () => {
    const Alpine = createMockAlpine();
    scrollPlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.cleanups.length).toBe(1);
  });

  it("does not crash when Alpine.cleanup is missing", () => {
    interface AlpineNoCleanup {
      stores: Record<string, unknown>;
      magics: Record<string, () => unknown>;
      plugin(cb: (alpine: AlpineNoCleanup) => void): void;
      store(name: string, value?: unknown): unknown;
      magic(name: string, factory: () => unknown): void;
    }
    const alpine: AlpineNoCleanup = {
      stores: {},
      magics: {},
      plugin(cb) {
        cb(alpine);
      },
      store(name, value?) {
        if (value === undefined) {
          return alpine.stores[name];
        }
        alpine.stores[name] = value;
        return undefined;
      },
      magic: () => undefined,
    };
    expect(() => scrollPlugin()(alpine as unknown as AlpineBase)).not.toThrow();
  });

  it("exposes the full ScrollStore surface", () => {
    const Alpine = createMockAlpine();
    scrollPlugin()(Alpine as unknown as AlpineBase);
    const store = Alpine.stores.scroll as ScrollStore;
    expect(typeof store.scrollIntoView).toBe("function");
    expect(typeof store.by).toBe("function");
    expect(typeof store.toTop).toBe("function");
    expect(typeof store.toBottom).toBe("function");
    expect(typeof store.lock).toBe("function");
    expect(typeof store.unlock).toBe("function");
    expect(typeof store.unlockAll).toBe("function");
  });
});

describe("scrollPlugin — store reactivity", () => {
  let Alpine: MockAlpine;

  beforeEach(() => {
    Alpine = createMockAlpine();
    scrollPlugin()(Alpine as unknown as AlpineBase);
  });
  afterEach(() => {
    Alpine.cleanups[0]?.();
  });

  it("Alpine.store('scroll') returns the reactive store", () => {
    const fromStore = Alpine.store("scroll") as ScrollStore;
    expect(fromStore).toBeDefined();
    expect(fromStore.locked).toBe(false);
  });

  it("$scroll magic returns the same reactive reference as Alpine.store('scroll')", () => {
    const fromStore = Alpine.store("scroll") as ScrollStore;
    const factory = Alpine.magics.scroll;
    const a = factory() as ScrollStore;
    const b = factory() as ScrollStore;
    expect(a).toBe(fromStore);
    expect(b).toBe(fromStore);
    expect(a).toBe(b);
  });

  it("store.lock(reason) acquires a lock and returns a handle", () => {
    const store = Alpine.store("scroll") as ScrollStore;
    const handle = store.lock("modal");
    expect(typeof handle).toBe("string");
    expect(handle.length).toBeGreaterThan(0);
  });
});

describe("scrollPlugin — cleanup", () => {
  it("Alpine.cleanup callback destroys the controller and tears down the subscription", () => {
    const Alpine = createMockAlpine();
    scrollPlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.cleanups.length).toBe(1);
    // Firing the cleanup callback must not throw and must be safe to
    // call when the controller is already torn down (e.g. on hot
    // reload).
    expect(() => Alpine.cleanups[0]()).not.toThrow();
    expect(() => Alpine.cleanups[0]()).not.toThrow();
  });
});

describe("createScroll — singleton guarantee", () => {
  beforeEach(() => {
    clearAllSingletons();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearAllSingletons();
  });

  it("returns the same controller for repeated calls in the same document", () => {
    const a = createScroll({ id: "first" });
    const b = createScroll({ id: "second" });
    expect(b).toBe(a);
  });

  it("controller.options are sticky — first call wins on subsequent calls", () => {
    const first = createScroll({ id: "sticky" });
    // Second call with different options returns the same controller
    // and does NOT rebuild — the original `id` is preserved.
    createScroll({ id: "ignored" });
    expect(first.id).toBe("sticky");
  });

  it("destroy() releases the singleton slot so the next call builds a fresh controller", () => {
    const first = createScroll({ id: "first" });
    first.destroy();
    const second = createScroll({ id: "second" });
    expect(second).not.toBe(first);
    expect(second.id).toBe("second");
  });

  it("scrollPlugin() and createScroll() return controllers that share state", () => {
    // scrollPlugin uses createScroll internally, so the controller it
    // owns is the same singleton `createScroll()` resolves.
    const Alpine = createMockAlpine();
    scrollPlugin({ id: "shared" })(Alpine as unknown as AlpineBase);
    const fromPlugin = Alpine.stores.scroll as ScrollStore;
    const fromFactory = createScroll({ id: "ignored" });
    // Same controller — locking via the store should be visible via
    // `controller.isLocked`.
    fromPlugin.lock("modal");
    expect(fromFactory.isLocked).toBe(true);
  });

  it("ScrollController can still be constructed directly (advanced consumers + tests)", () => {
    // The class is still exported so tests and advanced consumers
    // can bypass the singleton guarantee when they need a fresh
    // instance per case.
    const direct = new ScrollController({ id: "direct" });
    expect(direct.id).toBe("direct");
    direct.mount();
    direct.destroy();
  });
});
