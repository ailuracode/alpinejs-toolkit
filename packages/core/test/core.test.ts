import type AlpineType from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type AlpinePluginCallback,
  createAlpinePlugin,
  defineHybridPlugin,
  defineMagicPlugin,
  defineStorePlugin,
  getRegisteredPlugins,
  initPlugins,
  initPluginsSync,
  isPluginInitialized,
  PluginLoaderError,
  registerPlugin,
  resetPluginRegistry,
  unregisterPlugin,
} from "../src/index.js";

interface MockAlpine {
  plugin: ReturnType<typeof vi.fn>;
  magic: ReturnType<typeof vi.fn>;
  store: ReturnType<typeof vi.fn>;
}

function createMockAlpine(): MockAlpine {
  return {
    plugin: vi.fn(),
    magic: vi.fn(),
    store: vi.fn(),
  };
}

function alpinePluginMock(
  run: AlpinePluginCallback = (_alpine) => undefined
): AlpinePluginCallback {
  return vi.fn(run);
}

describe("@ailuracode/alpinejs-core", () => {
  afterEach(() => {
    resetPluginRegistry();
  });

  describe("registerPlugin", () => {
    it("registers magic, store, and hybrid plugins without initializing them", () => {
      const sharePlugin = vi.fn();
      const themePlugin = vi.fn();
      const attentionPlugin = vi.fn();

      registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));
      registerPlugin("theme", defineStorePlugin(["theme"], themePlugin));
      registerPlugin(
        "attention",
        defineHybridPlugin({
          magics: ["wakelock", "idle"],
          plugin: attentionPlugin,
        })
      );

      expect(getRegisteredPlugins()).toHaveLength(3);
      expect(sharePlugin).not.toHaveBeenCalled();
      expect(themePlugin).not.toHaveBeenCalled();
      expect(attentionPlugin).not.toHaveBeenCalled();
    });

    it("throws when registering duplicate plugin names", () => {
      registerPlugin("share", defineMagicPlugin(["share"], vi.fn()));

      expect(() => {
        registerPlugin("share", defineMagicPlugin(["share"], vi.fn()));
      }).toThrow('Plugin "share" is already registered');
    });

    it("validates plugin metadata", () => {
      expect(() => {
        registerPlugin("invalid", defineMagicPlugin([], vi.fn()));
      }).toThrow("Magic plugin must declare at least one magic name");

      expect(() => {
        registerPlugin("invalid", defineStorePlugin([], vi.fn()));
      }).toThrow("Store plugin must declare at least one store name");

      expect(() => {
        registerPlugin(
          "invalid",
          defineHybridPlugin({
            plugin: vi.fn(),
          })
        );
      }).toThrow("Hybrid plugin must declare at least one magic or store name");
    });
  });

  describe("initPlugins", () => {
    it("initializes only requested plugins in registration order", async () => {
      const calls: string[] = [];
      const sharePlugin = vi.fn((_Alpine: AlpineType.Alpine) => {
        calls.push("share");
      });
      const themePlugin = vi.fn((_Alpine: AlpineType.Alpine) => {
        calls.push("theme");
      });
      const networkPlugin = vi.fn((_Alpine: AlpineType.Alpine) => {
        calls.push("network");
      });

      registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));
      registerPlugin("theme", defineStorePlugin(["theme"], themePlugin));
      registerPlugin("network", defineMagicPlugin(["network"], networkPlugin));

      const Alpine = createMockAlpine();

      await initPlugins(Alpine as unknown as AlpineType.Alpine, ["theme", "share"]);

      expect(Alpine.plugin).toHaveBeenCalledTimes(2);

      for (const [callback] of Alpine.plugin.mock.calls) {
        callback(Alpine);
      }

      expect(calls).toEqual(["theme", "share"]);
      expect(isPluginInitialized("theme")).toBe(true);
      expect(isPluginInitialized("share")).toBe(true);
      expect(isPluginInitialized("network")).toBe(false);
    });

    it("supports lazy factories and dynamic imports", async () => {
      const sharePlugin = alpinePluginMock();
      const themePlugin = alpinePluginMock();

      registerPlugin(
        "share",
        defineMagicPlugin(["share"], () => sharePlugin)
      );
      registerPlugin(
        "theme",
        defineStorePlugin(["theme"], async () => themePlugin)
      );

      const Alpine = createMockAlpine();
      await initPlugins(Alpine as unknown as AlpineType.Alpine);

      expect(Alpine.plugin).toHaveBeenCalledTimes(2);

      for (const [callback] of Alpine.plugin.mock.calls) {
        await callback(Alpine);
      }

      expect(sharePlugin).toHaveBeenCalledOnce();
      expect(themePlugin).toHaveBeenCalledOnce();
    });

    it("is idempotent for already initialized plugins", async () => {
      const sharePlugin = alpinePluginMock();

      registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));

      const Alpine = createMockAlpine();
      await initPlugins(Alpine as unknown as AlpineType.Alpine, "share");
      await initPlugins(Alpine as unknown as AlpineType.Alpine, "share");

      expect(Alpine.plugin).toHaveBeenCalledOnce();
      Alpine.plugin.mock.calls[0][0](Alpine);
      expect(sharePlugin).toHaveBeenCalledOnce();
    });

    it("throws when requesting unknown plugins", async () => {
      const Alpine = createMockAlpine();

      await expect(initPlugins(Alpine as unknown as AlpineType.Alpine, "missing")).rejects.toThrow(
        'Plugin "missing" is not registered'
      );
    });

    it("throws when a loader does not resolve to a callback", async () => {
      registerPlugin(
        "broken",
        defineMagicPlugin(["broken"], () => ({}) as never)
      );

      const Alpine = createMockAlpine();

      await expect(initPlugins(Alpine as unknown as AlpineType.Alpine)).rejects.toThrow(
        PluginLoaderError
      );
    });
  });

  describe("initPluginsSync", () => {
    it("initializes sync plugins without promises", () => {
      const sharePlugin = alpinePluginMock();

      registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));

      const Alpine = createMockAlpine();
      initPluginsSync(Alpine as unknown as AlpineType.Alpine);

      expect(Alpine.plugin).toHaveBeenCalledOnce();
      Alpine.plugin.mock.calls[0][0](Alpine);
      expect(sharePlugin).toHaveBeenCalledOnce();
    });

    it("throws for async loaders", () => {
      registerPlugin(
        "theme",
        defineStorePlugin(["theme"], async () => vi.fn())
      );

      const Alpine = createMockAlpine();

      expect(() => {
        initPluginsSync(Alpine as unknown as AlpineType.Alpine);
      }).toThrow("Async plugin loaders require initPlugins()");
    });
  });

  describe("createAlpinePlugin", () => {
    it("bridges registered plugins into Alpine.plugin()", () => {
      const sharePlugin = alpinePluginMock();
      const themePlugin = alpinePluginMock();

      registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));
      registerPlugin("theme", defineStorePlugin(["theme"], themePlugin));

      const Alpine = createMockAlpine();
      createAlpinePlugin("share")(Alpine as unknown as AlpineType.Alpine);

      expect(Alpine.plugin).toHaveBeenCalledOnce();
      Alpine.plugin.mock.calls[0][0](Alpine);
      expect(sharePlugin).toHaveBeenCalledOnce();
      expect(themePlugin).not.toHaveBeenCalled();
    });
  });

  describe("registry utilities", () => {
    it("unregisters plugins before initialization", () => {
      registerPlugin("share", defineMagicPlugin(["share"], vi.fn()));

      expect(unregisterPlugin("share")).toBe(true);
      expect(getRegisteredPlugins()).toHaveLength(0);
    });
  });
});
