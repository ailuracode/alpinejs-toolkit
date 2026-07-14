/**
 * `safeMatchMedia` tests. The two watcher helpers were moved to a future
 * `@ailuracode/alpine-media` service package, so only the SSR-safe wrapper
 * stays in core and only it is covered here.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { isBrowser, safeMatchMedia } from "../src/index";

function installWindowStub(matchMedia: typeof window.matchMedia | undefined): void {
  vi.stubGlobal("window", { matchMedia });
  vi.stubGlobal("document", {});
}

beforeEach(() => {
  installWindowStub(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("safeMatchMedia", () => {
  it("returns null when window.matchMedia is not a function", () => {
    installWindowStub(undefined);
    assert.equal(isBrowser(), true);
    assert.equal(safeMatchMedia("(pointer: fine)"), null);
  });

  it("returns null when window is undefined", () => {
    vi.unstubAllGlobals();
    assert.equal(safeMatchMedia("(pointer: fine)"), null);
  });

  it("forwards to window.matchMedia when the API is present", () => {
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

    installWindowStub((() => stub) as typeof window.matchMedia);
    const result = safeMatchMedia("(pointer: fine)");
    assert.strictEqual(result, stub);
  });
});
