/**
 * lazyPlugin tests — validates the public overload through definition,
 * registration, and initialization.
 */
import assert from "node:assert/strict";
import { ToolkitError } from "@ailuracode/alpine-core/controller";
import type { Alpine } from "alpinejs";
import { afterEach, describe, it } from "vitest";
import {
  definePlugin,
  initPlugins,
  lazyPlugin,
  pluginCallback,
  pluginLoader,
  registerPlugin,
  resetPluginRegistry,
} from "../src/index";

interface MockAlpine {
  pluginCalls: Array<(Alpine: MockAlpine) => void>;
  plugin(callback: (Alpine: MockAlpine) => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    pluginCalls: [],
    plugin(callback) {
      alpine.pluginCalls.push(callback);
    },
  };
  return alpine;
}

function asAlpine(mock: MockAlpine): Alpine {
  return mock as unknown as Alpine;
}

afterEach(() => {
  resetPluginRegistry();
});

describe("lazyPlugin validation", () => {
  it("throws PLUGIN_INVALID_DEFINITION when kinds is empty", () => {
    assert.throws(
      () =>
        lazyPlugin([], {
          names: ["share"],
          import: async () => ({ default: () => undefined }),
        }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });

  it("throws PLUGIN_INVALID_DEFINITION when a flat names array is empty", () => {
    assert.throws(
      () =>
        lazyPlugin(["magic"], {
          names: [],
          import: async () => ({ default: () => undefined }),
        }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });
});

describe("lazyPlugin registration and initialization", () => {
  it("registers and initializes a magic plugin from a dynamic import", async () => {
    const calls: string[] = [];
    const share = (_alpine: Alpine): void => {
      calls.push("share");
    };

    registerPlugin(
      "share",
      lazyPlugin(["magic"], {
        names: ["share"],
        import: async () => ({ default: share }),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine), "share");

    assert.equal(Alpine.pluginCalls.length, 1);
    await Promise.resolve(Alpine.pluginCalls[0]?.(Alpine));
    assert.deepEqual(calls, ["share"]);
  });

  it("registers and initializes a store plugin from a pluginLoader default export", async () => {
    const calls: string[] = [];
    const theme = (_alpine: Alpine): void => {
      calls.push("theme");
    };

    registerPlugin(
      "theme",
      lazyPlugin(["store"], {
        names: ["theme"],
        import: async () => ({
          default: pluginLoader(() => theme),
        }),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine), "theme");

    assert.equal(Alpine.pluginCalls.length, 1);
    await Promise.resolve(Alpine.pluginCalls[0]?.(Alpine));
    assert.deepEqual(calls, ["theme"]);
  });

  it("registers and initializes a multi-kind plugin from a pluginCallback default export", async () => {
    const calls: string[] = [];
    const attention = (_alpine: Alpine): void => {
      calls.push("attention");
    };

    registerPlugin(
      "attention",
      lazyPlugin(["magic", "store"], {
        names: { magic: ["wakelock"], store: ["attention"] },
        import: async () => ({
          default: pluginCallback(attention),
        }),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine), "attention");

    assert.equal(Alpine.pluginCalls.length, 1);
    await Promise.resolve(Alpine.pluginCalls[0]?.(Alpine));
    assert.deepEqual(calls, ["attention"]);
  });

  it("matches definePlugin metadata for the same kinds and names", () => {
    const share = (_alpine: Alpine): void => undefined;

    const eager = definePlugin(["magic"], { names: ["share"], plugin: share });
    const lazy = lazyPlugin(["magic"], {
      names: ["share"],
      import: async () => ({ default: share }),
    });

    assert.deepEqual(lazy.kinds, eager.kinds);
    assert.deepEqual(lazy.names, eager.names);
    assert.equal(lazy.allowNameCrossKind, eager.allowNameCrossKind);
  });
});
