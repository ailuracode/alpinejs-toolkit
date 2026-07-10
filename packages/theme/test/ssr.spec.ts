/**
 * SSR-safe import tests for `@ailuracode/alpine-theme`.
 *
 * Per `.cursor/rules/formatting.mdc` and
 * `.cursor/rules/testing.mdc`, importing the package
 * MUST work in a runtime without `window` / `document`. These tests
 * shadow the globals with `undefined` and assert the public surface
 * stays usable.
 */

import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  createMemoryThemeStorage,
  createTheme,
  DEFAULT_THEME_PREFERENCE,
  readSystemTheme,
  themePlugin,
} from "../src/index";

function shadowGlobals(): () => void {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalMatchMedia = (globalThis as { matchMedia?: unknown }).matchMedia;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    writable: true,
    value: undefined,
  });
  (globalThis as { matchMedia?: unknown }).matchMedia = undefined;

  return () => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    }
    if (originalDocument) {
      Object.defineProperty(globalThis, "document", originalDocument);
    }
    if (originalMatchMedia === undefined) {
      (globalThis as { matchMedia?: unknown }).matchMedia = undefined;
    } else {
      (globalThis as { matchMedia?: unknown }).matchMedia = originalMatchMedia;
    }
  };
}

describe("SSR-safe package surface", () => {
  it("importing the package does not touch the DOM", () => {
    assert.equal(typeof createTheme, "function");
    assert.equal(typeof themePlugin, "function");
    assert.equal(DEFAULT_THEME_PREFERENCE, "system");
  });

  it("readSystemTheme returns the SSR default without window", () => {
    const restore = shadowGlobals();
    try {
      assert.equal(readSystemTheme(), "light");
    } finally {
      restore();
    }
  });

  it("createTheme runs under SSR with a custom storage adapter", () => {
    const restore = shadowGlobals();
    try {
      const theme = createTheme({
        defaultTheme: "light",
        storage: createMemoryThemeStorage(),
        target: null,
        strategy: "class",
      });
      assert.equal(theme.current, "light");
      assert.equal(theme.resolved, "light");
      // No throw on set, toggle, or reset.
      theme.set("dark");
      theme.toggle();
      theme.reset();
      theme.destroy();
    } finally {
      restore();
    }
  });

  it("themePlugin runs under SSR with a mock Alpine that does not touch the DOM", () => {
    const restore = shadowGlobals();
    try {
      const stores: Record<string, unknown> = {};
      const magics: Record<string, () => unknown> = {};
      type AlpineMock = {
        plugin: (cb: (alpine: AlpineMock) => void) => void;
        store(name: string, value: unknown): void;
        store(name: string): unknown;
        magic: (name: string, factory: () => unknown) => void;
      };
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
        magic(name, factory) {
          magics[name] = factory;
        },
      };

      themePlugin({
        defaultTheme: "light",
        storage: createMemoryThemeStorage(),
        target: null,
      })(Alpine as never);

      assert.ok(stores.theme);
      assert.ok(magics.theme);
    } finally {
      restore();
    }
  });
});
