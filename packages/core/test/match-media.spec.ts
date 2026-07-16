import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { isBrowser, safeMatchMedia } from "../src/index";

describe("safeMatchMedia", () => {
  it("returns null when window.matchMedia is not a function", () => {
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
        (globalThis as { window?: unknown }).window = undefined;
      }
      if (originalDocument) {
        Object.defineProperty(globalThis, "document", originalDocument);
      } else {
        (globalThis as { document?: unknown }).document = undefined;
      }
    }
  });

  it("forwards to window.matchMedia when the API is present", () => {
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
