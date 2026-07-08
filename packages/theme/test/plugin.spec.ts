/**
 * Alpine integration tests for `@ailuracode/alpine-theme`.
 *
 * Per `.agents/instructions/testing.instructions.md`, plugin tests cover
 * store registration, magic exposure, reactivity, and cleanup. A
 * minimal mock Alpine exercises the contract without booting the real
 * runtime.
 */

import assert from "node:assert/strict";
import { describe, it } from "vitest";
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
      if (arguments.length === 1) {
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
        if (arguments.length === 1) {
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
