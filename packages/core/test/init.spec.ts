/**
 * Init tests — Alpine integration layer. Mocks just enough of `Alpine` to
 * verify that `initPlugins`, `initPluginsSync`, and `createAlpinePlugin`
 * route through the registry and resolve loaders correctly.
 */
import assert from "node:assert/strict";
import type { Alpine } from "alpinejs";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  createAlpinePlugin,
  definePlugin,
  getRegisteredPlugin,
  initPlugins,
  initPluginsSync,
  isPluginInitialized,
  PluginLoaderError,
  registerPlugin,
  resetPluginRegistry,
} from "../src/index";

const MISSING_PLUGIN_REGEX = /Plugin "missing" is not registered/;

interface MockAlpine {
  pluginCalls: Array<(Alpine: MockAlpine) => void>;
  plugin(callback: (Alpine: MockAlpine) => void): void;
  magic(name: string, callback: () => unknown): void;
  store(name: string, callback: () => unknown): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    pluginCalls: [],
    plugin(callback) {
      alpine.pluginCalls.push(callback);
    },
    magic(_name, _callback) {
      /* noop */
    },
    store(_name, _callback) {
      /* noop */
    },
  };
  return alpine;
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

describe("initPlugins — selection", () => {
  it("initializes only requested plugins in registration order", async () => {
    const calls: string[] = [];
    const share = (_alpine: Alpine): void => {
      calls.push("share");
    };
    const theme = (_alpine: Alpine): void => {
      calls.push("theme");
    };
    const network = (_alpine: Alpine): void => {
      calls.push("network");
    };

    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: share }));
    registerPlugin("theme", definePlugin(["store"], { names: ["theme"], plugin: theme }));
    registerPlugin("network", definePlugin(["magic"], { names: ["network"], plugin: network }));

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine), ["theme", "share"]);

    assert.equal(Alpine.pluginCalls.length, 2);
    await Promise.all(
      Alpine.pluginCalls.map(async (callback) => {
        await Promise.resolve(callback(Alpine));
      })
    );

    assert.deepEqual(calls, ["theme", "share"]);
    assert.equal(isPluginInitialized("theme"), true);
    assert.equal(isPluginInitialized("share"), true);
    assert.equal(isPluginInitialized("network"), false);
  });

  it("initializes every plugin when no names are provided", async () => {
    registerPlugin(
      "share",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => undefined })
    );
    registerPlugin(
      "theme",
      definePlugin(["store"], { names: ["theme"], plugin: (_alpine) => undefined })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 2);
    assert.equal(getRegisteredPlugin("share")?.initialized, true);
    assert.equal(getRegisteredPlugin("theme")?.initialized, true);
  });

  it("treats an empty name list as a no-op", async () => {
    registerPlugin(
      "share",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => undefined })
    );

    const Alpine = createMockAlpine();
    const result = await initPlugins(asAlpine(Alpine), []);

    assert.deepEqual(result, []);
    assert.equal(Alpine.pluginCalls.length, 0);
  });
});

describe("initPlugins — loaders", () => {
  it("supports lazy factories and dynamic imports", async () => {
    const share = (): void => undefined;
    const theme = (): void => undefined;

    registerPlugin(
      "share",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => share })
    );
    registerPlugin(
      "theme",
      definePlugin(["store"], {
        names: ["theme"],
        plugin: (_alpine) => Promise.resolve(theme),
      })
    );

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 2);
    await Promise.all(
      Alpine.pluginCalls.map(async (callback) => {
        await Promise.resolve(callback(Alpine));
      })
    );
  });

  it("is idempotent for already initialized plugins", async () => {
    const share = (_alpine: Alpine): void => undefined;

    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: share }));

    const Alpine = createMockAlpine();
    await initPlugins(asAlpine(Alpine), "share");
    await initPlugins(asAlpine(Alpine), "share");

    assert.equal(Alpine.pluginCalls.length, 1);
    Alpine.pluginCalls[0]?.(Alpine);
  });
});

describe("initPlugins — errors", () => {
  it("rejects when requesting unknown plugins", async () => {
    const Alpine = createMockAlpine();
    await assert.rejects(() => initPlugins(asAlpine(Alpine), "missing"), MISSING_PLUGIN_REGEX);
  });

  it("rejects with PluginLoaderError when a 0-arg factory resolves to a non-function", async () => {
    // The 0-arg-then-non-function path is the canonical "factory returns non-callback".
    registerPlugin(
      "broken",
      definePlugin(["magic"], { names: ["broken"], plugin: (): unknown => ({}) as never })
    );

    const Alpine = createMockAlpine();
    await assert.rejects(() => initPlugins(asAlpine(Alpine)), PluginLoaderError);
  });
});

describe("initPluginsSync", () => {
  it("initializes sync plugins without promises", () => {
    const share = (_alpine: Alpine): void => undefined;

    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: share }));

    const Alpine = createMockAlpine();
    initPluginsSync(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
    Alpine.pluginCalls[0]?.(Alpine);
  });

  it("throws PluginLoaderError for async factory loaders", () => {
    // A zero-arg factory that returns a Promise IS a lazy async factory;
    // initPluginsSync must reject it because it cannot await.
    registerPlugin(
      "theme",
      definePlugin(["store"], {
        names: ["theme"],
        plugin: (): Promise<() => void> => Promise.resolve(() => undefined),
      })
    );

    const Alpine = createMockAlpine();

    assert.throws(
      () => initPluginsSync(asAlpine(Alpine)),
      (error: unknown) => error instanceof PluginLoaderError
    );
  });
});

describe("createAlpinePlugin", () => {
  it("bridges registered plugins into Alpine.plugin()", () => {
    let shareCalls = 0;
    let themeCalls = 0;

    registerPlugin(
      "share",
      definePlugin(["magic"], {
        names: ["share"],
        plugin: (_alpine: Alpine) => {
          shareCalls += 1;
        },
      })
    );
    registerPlugin(
      "theme",
      definePlugin(["store"], {
        names: ["theme"],
        plugin: (_alpine: Alpine) => {
          themeCalls += 1;
        },
      })
    );

    const Alpine = createMockAlpine();
    createAlpinePlugin("share")(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
    Alpine.pluginCalls[0]?.(Alpine);

    assert.equal(shareCalls, 1);
    assert.equal(themeCalls, 0);
  });

  it("initializes every plugin when called with no names", () => {
    registerPlugin(
      "share",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => undefined })
    );
    registerPlugin(
      "theme",
      definePlugin(["store"], { names: ["theme"], plugin: (_alpine) => undefined })
    );

    const Alpine = createMockAlpine();
    createAlpinePlugin()(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 2);
  });

  it("initializes a multi-kind plugin alongside single-shape plugins", () => {
    registerPlugin(
      "attention",
      definePlugin(["magic", "store"], {
        names: { magic: ["wakelock"], store: ["attention"] },
        plugin: (_alpine) => undefined,
      })
    );

    const Alpine = createMockAlpine();
    createAlpinePlugin("attention")(asAlpine(Alpine));

    assert.equal(Alpine.pluginCalls.length, 1);
  });

  it("returns a directive definition with the expected kinds", () => {
    registerPlugin(
      "navigation",
      definePlugin(["directive"], { names: ["navigation"], plugin: (_alpine) => undefined })
    );

    const entry = getRegisteredPlugin("navigation");
    assert.ok(entry);
    assert.deepEqual(entry?.definition.kinds, ["directive"]);
  });
});
