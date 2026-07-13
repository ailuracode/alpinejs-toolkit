/**
 * Plugin source resolution — explicit callback vs loader discrimination.
 */
import assert from "node:assert/strict";
import type { Alpine } from "alpinejs";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  definePlugin,
  initPlugins,
  initPluginsSync,
  PluginLoaderError,
  pluginCallback,
  pluginLoader,
  registerPlugin,
  resetPluginRegistry,
} from "../src/index";
import type { AlpinePluginCallback } from "../src/types";

interface MockAlpine {
  pluginCalls: Array<(Alpine: MockAlpine) => void>;
  plugin(callback: (Alpine: MockAlpine) => void): void;
}

function createMockAlpine(): MockAlpine {
  return {
    pluginCalls: [],
    plugin(callback) {
      this.pluginCalls.push(callback);
    },
  };
}

function asAlpine(mock: MockAlpine): Alpine {
  return mock as unknown as Alpine;
}

beforeEach(() => {
  resetPluginRegistry();
});

afterEach(() => {
  resetPluginRegistry();
});

describe("plugin source resolution", () => {
  it("treats zero-argument callbacks as direct plugins, not loaders", async () => {
    const directCallback = (): void => undefined;

    registerPlugin("zero", definePlugin(["magic"], { names: ["zero"], plugin: directCallback }));

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
    assert.equal(Alpine.pluginCalls[0], directCallback);
  });

  it("treats callbacks with default parameters as direct plugins", async () => {
    const withDefault = (_alpine: Alpine = undefined as unknown as Alpine): void => undefined;

    registerPlugin(
      "defaults",
      definePlugin(["magic"], { names: ["defaults"], plugin: withDefault })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
    assert.equal(Alpine.pluginCalls[0], withDefault);
  });

  it("resolves sync loaders through the explicit loader path", async () => {
    const share = (_alpine: Alpine): void => undefined;

    registerPlugin(
      "share",
      definePlugin(["magic"], {
        names: ["share"],
        plugin: pluginLoader(() => share),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
    assert.equal(Alpine.pluginCalls[0], share);
  });

  it("resolves async loaders through the explicit loader path", async () => {
    const theme = (_alpine: Alpine): void => undefined;

    registerPlugin(
      "theme",
      definePlugin(["store"], {
        names: ["theme"],
        plugin: pluginLoader(() => Promise.resolve(theme)),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
    assert.equal(Alpine.pluginCalls[0], theme);
  });

  it("wraps pluginCallback() as a direct source", async () => {
    const callback = (_alpine: Alpine): void => undefined;

    registerPlugin(
      "wrapped",
      definePlugin(["magic"], {
        names: ["wrapped"],
        plugin: pluginCallback(callback),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls[0], callback);
  });

  it("rejects sync loaders that resolve to non-functions", async () => {
    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: pluginLoader((() => ({})) as () => AlpinePluginCallback),
      })
    );

    const Alpine = createMockAlpine();
    await assert.rejects(() => initPlugins(asAlpine(Alpine)), PluginLoaderError);
  });

  it("rejects async loaders that resolve to non-functions", async () => {
    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: pluginLoader(() => Promise.resolve({}) as unknown as AlpinePluginCallback),
      })
    );

    const Alpine = createMockAlpine();
    await assert.rejects(() => initPlugins(asAlpine(Alpine)), PluginLoaderError);
  });

  it("throws when initPluginsSync receives an async loader", () => {
    registerPlugin(
      "theme",
      definePlugin(["store"], {
        names: ["theme"],
        plugin: pluginLoader(() => Promise.resolve(() => undefined)),
      })
    );

    const Alpine = createMockAlpine();

    assert.throws(
      () => initPluginsSync(asAlpine(Alpine)),
      (error: unknown) => error instanceof PluginLoaderError
    );
  });
});
