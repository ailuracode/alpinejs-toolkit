/**
 * Scoped singleton tests for `@ailuracode/alpine-theme`.
 */
import assert from "node:assert/strict";
import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, describe, it } from "vitest";
import { createTheme } from "../src/controller.js";

afterEach(() => {
  clearAllSingletons();
});

describe("createTheme — scoped singletons", () => {
  it("returns independent instances for distinct scopes", () => {
    const scopeA = {};
    const scopeB = {};
    const themeA = createTheme({ scope: scopeA, defaultTheme: "light" });
    const themeB = createTheme({ scope: scopeB, defaultTheme: "dark" });
    assert.notEqual(themeA, themeB);
    assert.equal(themeA.current, "light");
    assert.equal(themeB.current, "dark");
  });

  it("reuses the live instance inside one scope", () => {
    const scope = {};
    const first = createTheme({ scope, defaultTheme: "light" });
    const second = createTheme({ scope, defaultTheme: "dark" });
    assert.equal(first, second);
    assert.equal(second.current, "light");
  });

  it("releases only the destroyed instance scope", () => {
    const scopeA = {};
    const scopeB = {};
    const themeA = createTheme({ scope: scopeA });
    const themeB = createTheme({ scope: scopeB });
    themeA.destroy();
    const rebuiltA = createTheme({ scope: scopeA });
    assert.notEqual(rebuiltA, themeA);
    assert.equal(createTheme({ scope: scopeB }), themeB);
  });
});
