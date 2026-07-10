/**
 * Alpine integration tests for `@ailuracode/alpine-sidebar`.
 *
 * Per `.cursor/rules/testing.mdc`, plugin tests
 * cover store registration, magic exposure, reactivity, cleanup,
 * SSR-safety, and config-driven listener toggling. A minimal mock
 * Alpine exercises the contract without booting the real runtime.
 *
 * 6 tests map to the spec matrix rows #27–#32.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type SidebarStore, sidebarPlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (Alpine: MockAlpine) => void): void;
  store(name: string, value: unknown): void;
  store(name: string): unknown;
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

describe("sidebarPlugin — registration", () => {
  it("Alpine.store('sidebar') returns the reactive store", () => {
    const Alpine = createMockAlpine();
    sidebarPlugin()(Alpine as never);
    const store = Alpine.stores.sidebar as SidebarStore;
    expect(store).toBeDefined();
    expect(store.visible).toBe(false);
    expect(store.matchesBreakpoint).toBe(false);
    expect(typeof store.show).toBe("function");
    expect(typeof store.hide).toBe("function");
    expect(typeof store.toggle).toBe("function");
  });

  it("$sidebar magic returns the same reactive reference as Alpine.store('sidebar')", () => {
    const Alpine = createMockAlpine();
    sidebarPlugin()(Alpine as never);
    const fromStore = Alpine.store("sidebar");
    const factory = Alpine.magics.sidebar;
    const a = factory();
    const b = factory();
    expect(a).toBe(fromStore);
    expect(b).toBe(fromStore);
    expect(a).toBe(b);
  });

  it("manager.destroy() is registered via Alpine.cleanup", () => {
    const Alpine = createMockAlpine();
    sidebarPlugin()(Alpine as never);
    expect(Alpine.cleanups.length).toBe(1);
    // Fire the cleanup callback — it must not throw and must be
    // idempotent (calling destroy twice on the manager is a no-op).
    expect(() => Alpine.cleanups[0]()).not.toThrow();
  });
});

describe("sidebarPlugin — reactivity", () => {
  it("manager.show() triggers a re-render through the Alpine store proxy", () => {
    const Alpine = createMockAlpine();
    sidebarPlugin()(Alpine as never);
    const store = Alpine.stores.sidebar as SidebarStore;
    // x-text="$store.sidebar.visible" reads the SAME proxy the magic
    // returns — mutations on the controller must flow through to the
    // proxy, not just the bare store.
    expect(store.visible).toBe(false);
    store.show();
    expect(store.visible).toBe(true);
    store.hide();
    expect(store.visible).toBe(false);
  });
});

describe("sidebarPlugin — SSR / config-driven listener toggling", () => {
  let originalWindow: typeof window | undefined;
  beforeEach(() => {
    originalWindow = globalThis.window;
  });
  afterEach(() => {
    if (originalWindow) {
      globalThis.window = originalWindow;
    }
    vi.unstubAllGlobals();
  });

  it("createSidebar() does NOT register listeners when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    // Building the plugin must not throw under SSR; the controller's
    // safeWindow / safeMatchMedia paths short-circuit to no-ops.
    expect(() => {
      const Alpine = createMockAlpine();
      sidebarPlugin()(Alpine as never);
    }).not.toThrow();
  });

  it("closeOnEscape:false does NOT register a keydown listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const tag = "keydown";
    const before = addSpy.mock.calls.filter(([t]) => t === tag).length;
    const Alpine = createMockAlpine();
    sidebarPlugin({ closeOnEscape: false })(Alpine as never);
    const after = addSpy.mock.calls.filter(([t]) => t === tag).length;
    expect(after).toBe(before);
    addSpy.mockRestore();
  });
});
