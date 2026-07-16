/**
 * Scoped singleton tests for `@ailuracode/alpine-theme`.
 */
import assert from "node:assert/strict";
import { clearAllSingletons, createSingletonScope } from "@ailuracode/alpine-core/singleton";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTheme } from "../src/controller.js";

afterEach(() => {
  clearAllSingletons();
});

describe("createTheme — scoped singletons", () => {
  it("returns independent instances for distinct scopes", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    const themeA = createTheme({ scope: scopeA, defaultTheme: "light" });
    const themeB = createTheme({ scope: scopeB, defaultTheme: "dark" });
    assert.notEqual(themeA, themeB);
    assert.equal(themeA.current, "light");
    assert.equal(themeB.current, "dark");
  });

  it("reuses the live instance inside one scope", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const scope = createSingletonScope();
    const first = createTheme({ scope, defaultTheme: "light" });
    const second = createTheme({ scope, defaultTheme: "dark" });
    assert.equal(first, second);
    assert.equal(second.current, "light");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Singleton "@ailuracode/alpine-theme/default" already exists in this scope with different options'
      )
    );
    warnSpy.mockRestore();
  });

  it("releases only the destroyed instance scope", () => {
    const scopeA = createSingletonScope();
    const scopeB = createSingletonScope();
    const themeA = createTheme({ scope: scopeA });
    const themeB = createTheme({ scope: scopeB });
    themeA.destroy();
    const rebuiltA = createTheme({ scope: scopeA });
    assert.notEqual(rebuiltA, themeA);
    assert.equal(createTheme({ scope: scopeB }), themeB);
  });
});
