/**
 * Public surface contract — every helper promoted from
 * `@ailuracode/alpine-core` / `…lang` / `…media` / `…theme`'s
 * `src/internal/` directory must be reachable through the package's
 * public barrel.
 *
 * Locks the move performed by ALP-30. If a future refactor moves
 * one of these helpers back under `internal/` (or accidentally drops
 * the re-export), this test fails.
 */

import * as core from "@ailuracode/alpine-core";
import * as lang from "@ailuracode/alpine-lang";
import * as media from "@ailuracode/alpine-media";
import * as theme from "@ailuracode/alpine-theme";
import { describe, expect, it } from "vitest";

describe("core public surface", () => {
  describe("browser helpers", () => {
    it("exports isBrowser / safeDocument / safeMatchMedia / safeWindow", () => {
      expect(typeof core.isBrowser).toBe("function");
      expect(typeof core.safeDocument).toBe("function");
      expect(typeof core.safeMatchMedia).toBe("function");
      expect(typeof core.safeWindow).toBe("function");
    });
  });

  describe("plugin definition", () => {
    it("exports definePlugin / lazyPlugin", () => {
      expect(typeof core.definePlugin).toBe("function");
      expect(typeof core.lazyPlugin).toBe("function");
    });
  });

  describe("plugin initialization", () => {
    it("exports initPlugins / initPluginsSync / createAlpinePlugin", () => {
      expect(typeof core.initPlugins).toBe("function");
      expect(typeof core.initPluginsSync).toBe("function");
      expect(typeof core.createAlpinePlugin).toBe("function");
    });
  });

  describe("plugin registry", () => {
    it("exports registry functions", () => {
      expect(typeof core.registerPlugin).toBe("function");
      expect(typeof core.unregisterPlugin).toBe("function");
      expect(typeof core.getRegisteredPlugin).toBe("function");
      expect(typeof core.getRegisteredPlugins).toBe("function");
      expect(typeof core.isPluginInitialized).toBe("function");
      expect(typeof core.markPluginInitialized).toBe("function");
      expect(typeof core.resetPluginRegistry).toBe("function");
      expect(typeof core.resolvePluginEntries).toBe("function");
      expect(typeof core.setRegistryDebugSink).toBe("function");
      expect(typeof core.getRegistryDebugSink).toBe("function");
    });
  });

  describe("singleton helper", () => {
    it("exports createSingleton / getSingleton / setSingleton / clearSingleton / clearAllSingletons", () => {
      expect(typeof core.createSingleton).toBe("function");
      expect(typeof core.getSingleton).toBe("function");
      expect(typeof core.setSingleton).toBe("function");
      expect(typeof core.clearSingleton).toBe("function");
      expect(typeof core.clearAllSingletons).toBe("function");
    });
  });

  describe("errors", () => {
    it("exports PluginLoaderError class", () => {
      expect(typeof core.PluginLoaderError).toBe("function");
    });
  });
});

describe("lang public surface", () => {
  it("exports normalizeLanguageTag / parseLanguageTag", () => {
    expect(typeof lang.normalizeLanguageTag).toBe("function");
    expect(typeof lang.parseLanguageTag).toBe("function");
  });
});

describe("media public surface", () => {
  it("exports resolveMediaBreakpoint", () => {
    expect(typeof media.resolveMediaBreakpoint).toBe("function");
  });
});

describe("theme public surface", () => {
  it("exports storage adapters and system helper", () => {
    expect(typeof theme.createLocalStorageThemeStorage).toBe("function");
    expect(typeof theme.createMemoryThemeStorage).toBe("function");
    expect(typeof theme.readSystemTheme).toBe("function");
  });
});
