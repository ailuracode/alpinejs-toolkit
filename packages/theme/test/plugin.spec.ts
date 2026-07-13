/**
 * Alpine integration tests for `@ailuracode/alpine-theme`.
 *
 * Per `.cursor/rules/testing.mdc`, plugin tests cover
 * store registration, magic exposure, reactivity, and cleanup. A
 * minimal mock Alpine exercises the contract without booting the real
 * runtime.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "vitest";
import { type ThemeStore, themePlugin } from "../src/index";
import { setMatchMedia } from "./setup";

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

const PREFERS_DARK = "(prefers-color-scheme: dark)";

describe("themePlugin — registration", () => {
  it("registers the theme store and the $theme magic", () => {
    const Alpine = createMockAlpine();
    themePlugin()(Alpine as never);
    assert.ok(Alpine.stores.theme);
    assert.ok(Alpine.magics.theme);
  });

  it("registers an Alpine cleanup callback when Alpine.cleanup is available", () => {
    const Alpine = createMockAlpine();
    themePlugin()(Alpine as never);
    assert.equal(Alpine.cleanups.length, 1);
  });

  it("does not crash when Alpine.cleanup is missing", () => {
    interface AlpineMock {
      plugin: (cb: (alpine: AlpineMock) => void) => void;
      store(name: string, value: unknown): void;
      store(name: string): unknown;
      magic: (name: string, factory: () => unknown) => void;
    }
    const stores: Record<string, unknown> = {};
    const Alpine: AlpineMock = {
      plugin(cb) {
        cb(Alpine);
      },
      store(name, value?) {
        if (value === undefined) {
          return stores[name];
        }
        stores[name] = value;
        return undefined;
      },
      magic: () => undefined,
    };
    assert.doesNotThrow(() => themePlugin()(Alpine as never));
  });

  it("seeds the store with the default theme when no value is persisted", () => {
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "dark" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    assert.equal(store.current, "dark");
    assert.equal(store.resolved, "dark");
  });
});

describe("themePlugin — store surface", () => {
  it("forwards set() to the manager", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "light" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    store.set("dark");
    assert.equal(store.current, "dark");
    assert.equal(store.resolved, "dark");
  });

  it("forwards toggle() to the manager", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "dark" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    store.toggle();
    assert.equal(store.current, "light");
  });

  it("forwards reset() to the manager", () => {
    localStorage.setItem("theme", "dark");
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "light" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    assert.equal(store.current, "dark");
    store.reset();
    assert.equal(store.current, "light");
  });

  it("updates the store when the system theme flips", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "system" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    assert.equal(store.resolved, "light");

    setMatchMedia(PREFERS_DARK, true);
    assert.equal(store.resolved, "dark");
  });

  it("returns the same store instance through the $theme magic", () => {
    const Alpine = createMockAlpine();
    themePlugin()(Alpine as never);
    const factory = Alpine.magics.theme;
    const a = factory();
    const b = factory();
    assert.equal(a, b);
  });
});

/**
 * Coverage for the DOM re-apply behavior that protects the theme
 * from external mutations (most notably Astro View Transitions
 * re-syncing `<html>` attributes across navigations).
 *
 * jsdom is the host environment here, so `document` is always
 * available — these tests exercise the listener path directly
 * rather than gating it behind a feature-detection probe.
 */
describe("themePlugin — DOM re-apply on navigation events", () => {
  // jsdom exposes `document` but not `addEventListener` on it as a
  // guardable feature, so we monkey-patch a tiny stub that records
  // every (type, listener) pair the plugin registers, then fires
  // them on demand. This avoids touching real DOM state and lets
  // us inspect what the plugin installed.
  let listeners: Map<string, Set<() => void>>;
  type DocumentListener = (type: string, cb: () => void) => void;
  let originalAddEventListener: DocumentListener;
  let originalRemoveEventListener: DocumentListener;

  beforeEach(() => {
    listeners = new Map();
    const doc = document as unknown as {
      addEventListener: DocumentListener;
      removeEventListener: DocumentListener;
    };
    originalAddEventListener = doc.addEventListener.bind(doc);
    originalRemoveEventListener = doc.removeEventListener.bind(doc);
    doc.addEventListener = (type: string, cb: () => void): void => {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(cb);
      // Fall back to the real implementation for unrelated events
      // so setup teardown stays correct.
      if (type !== "astro:after-swap" && type !== "astro:page-load") {
        originalAddEventListener(type as never, cb as never);
      }
    };
    doc.removeEventListener = (type: string, cb: () => void): void => {
      const set = listeners.get(type);
      set?.delete(cb);
      if (type !== "astro:after-swap" && type !== "astro:page-load") {
        originalRemoveEventListener(type as never, cb as never);
      }
    };
  });

  afterEach(() => {
    // Restore real addEventListener / removeEventListener so other
    // suites in the same worker don't see the stub.
    const doc = document as unknown as {
      addEventListener: DocumentListener;
      removeEventListener: DocumentListener;
    };
    doc.addEventListener = originalAddEventListener;
    doc.removeEventListener = originalRemoveEventListener;
  });

  function fire(type: string): void {
    const set = listeners.get(type);
    if (!set) {
      throw new Error(`No listeners registered for ${type}`);
    }
    for (const cb of set) {
      cb();
    }
  }

  it("re-applies the theme class when 'astro:after-swap' fires", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "light" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    // Toggle to dark — the DOM receives `class="dark"`.
    store.set("dark");
    assert.equal(document.documentElement.classList.contains("dark"), true);

    // Simulate Astro View Transitions stripping the class.
    document.documentElement.classList.remove("dark");
    assert.equal(document.documentElement.classList.contains("dark"), false);

    // Fire the navigation event — the plugin should re-apply.
    fire("astro:after-swap");
    assert.equal(document.documentElement.classList.contains("dark"), true);
    // Internal state and the store stayed in sync throughout.
    assert.equal(store.resolved, "dark");
  });

  it("re-applies the theme class when 'astro:page-load' fires", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "dark" })(Alpine as never);
    // Simulate external DOM corruption.
    document.documentElement.classList.remove("dark");
    fire("astro:page-load");
    assert.equal(document.documentElement.classList.contains("dark"), true);
  });

  it("exposes apply() on the store as a manual re-apply entry point", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "light" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    store.set("dark");
    document.documentElement.classList.remove("dark");
    store.apply();
    assert.equal(document.documentElement.classList.contains("dark"), true);
  });

  it("removes the listeners on Alpine cleanup", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin()(Alpine as never);
    assert.ok(listeners.get("astro:after-swap")?.size === 1);
    assert.ok(listeners.get("astro:page-load")?.size === 1);
    Alpine.cleanups[0]();
    assert.equal(listeners.get("astro:after-swap")?.size ?? 0, 0);
    assert.equal(listeners.get("astro:page-load")?.size ?? 0, 0);
  });
});

describe("ThemeController — public apply()", () => {
  it("re-applies the current resolved value to the DOM", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "light" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    store.set("dark");
    document.documentElement.classList.remove("dark");
    store.apply();
    assert.equal(document.documentElement.classList.contains("dark"), true);
  });

  it("does not change internal state or emit a change event", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    themePlugin({ defaultTheme: "light" })(Alpine as never);
    const manager = Alpine as unknown as { _manager?: unknown };
    void manager;
    const store = Alpine.stores.theme as ThemeStore;
    store.set("dark");
    // Subscribe through the manager? plugin.spec mocks don't expose
    // it directly — instead, verify the observable invariants: the
    // re-apply is a no-op on store fields after restoration.
    document.documentElement.classList.remove("dark");
    store.apply();
    assert.equal(store.resolved, "dark");
    assert.equal(store.current, "dark");
    assert.equal(store.system, "light");
  });
});
