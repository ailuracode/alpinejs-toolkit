/**
 * `safeMatchMedia` tests. The two watcher helpers were moved to a future
 * `@ailuracode/alpine-media` service package, so only the SSR-safe wrapper
 * stays in core and only it is covered here.
 */
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { isBrowser, safeMatchMedia } from "../src/index";

describe("safeMatchMedia", () => {
  it("returns null when window.matchMedia is not a function", () => {
    // The global test setup stubs `matchMedia` for happy-dom. Temporarily
    // remove it so the helper sees the "API absent" branch it has to
    // handle — the SSR contract under test.
    const original = globalThis.window.matchMedia;
    try {
      globalThis.window.matchMedia = undefined as unknown as typeof window.matchMedia;
      assert.equal(isBrowser(), true);
      assert.equal(safeMatchMedia("(pointer: fine)"), null);
    } finally {
      globalThis.window.matchMedia = original;
    }
  });

  it("returns null when window is undefined", () => {
    // Simulate a non-browser runtime by shadowing `window` and `document`
    // with `undefined` for the duration of the call, then restoring the
    // original globals. We shadow instead of `delete` because the happy-dom
    // environment does not expose those as configurable.
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

    try {
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
      assert.equal(safeMatchMedia("(pointer: fine)"), null);
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", originalWindow);
      } else {
        // happy-dom cleanup needs the slot freed
        (globalThis as { window?: unknown }).window = undefined;
      }
      if (originalDocument) {
        Object.defineProperty(globalThis, "document", originalDocument);
      } else {
        // happy-dom cleanup needs the slot freed
        (globalThis as { document?: unknown }).document = undefined;
      }
    }
  });

  it("forwards to window.matchMedia when the API is present", () => {
    // Install a minimal `matchMedia` polyfill, call the helper, then
    // restore the original (which under happy-dom is `undefined`).
    const original = globalThis.window.matchMedia;
    const stub: MediaQueryList = {
      media: "(pointer: fine)",
      matches: true,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    };

    try {
      globalThis.window.matchMedia = (() => stub) as typeof window.matchMedia;
      const result = safeMatchMedia("(pointer: fine)");
      assert.strictEqual(result, stub);
    } finally {
      globalThis.window.matchMedia = original;
    }
  });
});
