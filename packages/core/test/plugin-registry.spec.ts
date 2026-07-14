/**
 * Registry tests — validates that plugin metadata is accepted and rejected
 * under the same conditions the source code enforces, and that
 * {@link resetPluginRegistry} cleanly isolates each test.
 *
 * Mirrors the contract every feature package's Alpine integration is
 * expected to satisfy: registry isolation, descriptive validation errors,
 * idempotent reset.
 */
import assert from "node:assert/strict";
import type { Alpine } from "alpinejs";
import { afterEach, describe, it } from "vitest";
import {
  definePlugin,
  getRegisteredPlugin,
  getRegisteredPlugins,
  isPluginInitialized,
  markPluginInitialized,
  registerPlugin,
  resetPluginRegistry,
  ToolkitError,
  unregisterPlugin,
} from "../src/index";

interface MockAlpine {
  id: string;
}

function createMockAlpine(id = "runtime"): MockAlpine {
  return { id };
}

function asAlpine(mock: MockAlpine): Alpine {
  return mock as unknown as Alpine;
}

interface TrackedCallback {
  (): void;
  calls: number;
}

function tracker(): TrackedCallback {
  const fn = ((): void => undefined) as TrackedCallback;
  fn.calls = 0;
  return fn;
}

afterEach(() => {
  resetPluginRegistry();
});

describe("registerPlugin acceptance", () => {
  it("registers magic, store, hybrid, and directive plugins without initializing them", () => {
    const share = tracker();
    const theme = tracker();
    const attention = tracker();
    const navigation = tracker();

    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: share }));
    registerPlugin("theme", definePlugin(["store"], { names: ["theme"], plugin: theme }));
    registerPlugin(
      "attention",
      definePlugin(["magic", "store"], {
        names: { magic: ["wakelock", "idle"], store: ["attention"] },
        plugin: attention,
      })
    );
    registerPlugin(
      "navigation",
      definePlugin(["directive"], { names: ["navigation"], plugin: navigation })
    );

    const entries = getRegisteredPlugins();
    assert.equal(entries.length, 4);
    assert.deepEqual(
      entries.map((entry) => entry.name),
      ["share", "theme", "attention", "navigation"]
    );

    assert.equal(share.calls, 0);
    assert.equal(theme.calls, 0);
    assert.equal(attention.calls, 0);
    assert.equal(navigation.calls, 0);
  });
});

describe("definePlugin validation", () => {
  it("throws PLUGIN_INVALID_DEFINITION when kinds is empty", () => {
    assert.throws(
      () => definePlugin([], { names: ["share"], plugin: tracker() }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });

  it("throws PLUGIN_INVALID_DEFINITION when kinds has duplicates", () => {
    assert.throws(
      () => definePlugin(["magic", "magic"], { names: ["share"], plugin: tracker() }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });

  it("throws PLUGIN_INVALID_DEFINITION when a flat names array is empty", () => {
    assert.throws(
      () => definePlugin(["magic"], { names: [], plugin: tracker() }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });

  it("throws PLUGIN_INVALID_DEFINITION when an object-form kind has no names", () => {
    assert.throws(
      () =>
        definePlugin(["magic", "store"], {
          names: { magic: ["wakelock"] },
          plugin: tracker(),
        }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });

  it("throws PLUGIN_INVALID_DEFINITION when a flat array is used with multiple kinds", () => {
    assert.throws(
      () =>
        definePlugin(["magic", "store"], {
          names: ["share"],
          plugin: tracker(),
        }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });

  it("throws PLUGIN_INVALID_DEFINITION when a name appears under two kinds", () => {
    assert.throws(
      () =>
        definePlugin(["magic", "store"], {
          names: { magic: ["shared"], store: ["shared"] },
          plugin: tracker(),
        }),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_INVALID_DEFINITION");
        return true;
      }
    );
  });
});

describe("registerPlugin validation", () => {
  it("throws a ToolkitError with PLUGIN_DUPLICATE for repeated names", () => {
    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() }));

    assert.throws(
      () =>
        registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() })),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_DUPLICATE");
        return true;
      }
    );
  });

  it("throws a ToolkitError with PLUGIN_NAME_REQUIRED for empty names", () => {
    assert.throws(
      () => registerPlugin("   ", definePlugin(["magic"], { names: ["share"], plugin: tracker() })),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_NAME_REQUIRED");
        return true;
      }
    );
  });
});

describe("registry mutations", () => {
  it("returns registered entries by name", () => {
    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() }));

    const entry = getRegisteredPlugin("share");
    assert.ok(entry);
    assert.equal(entry?.name, "share");
    assert.deepEqual(entry?.definition.kinds, ["magic"]);
  });

  it("unregisters plugins before initialization and reports presence", () => {
    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() }));
    assert.equal(getRegisteredPlugins().length, 1);

    assert.equal(unregisterPlugin("share"), true);
    assert.equal(unregisterPlugin("share"), false);
    assert.equal(getRegisteredPlugins().length, 0);
  });

  it("keeps initialization independent of registration", () => {
    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() }));
    const Alpine = createMockAlpine();

    assert.equal(isPluginInitialized("share", asAlpine(Alpine)), false);
    markPluginInitialized("share", asAlpine(Alpine));
    assert.equal(isPluginInitialized("share", asAlpine(Alpine)), true);

    assert.throws(
      () => markPluginInitialized("missing", asAlpine(Alpine)),
      (error: unknown) => {
        assert.ok(error instanceof ToolkitError);
        assert.equal((error as ToolkitError).code, "PLUGIN_UNKNOWN");
        return true;
      }
    );
  });

  it("tracks initialization per Alpine runtime", () => {
    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() }));
    const alpineA = createMockAlpine("a");
    const alpineB = createMockAlpine("b");

    markPluginInitialized("share", asAlpine(alpineA));

    assert.equal(isPluginInitialized("share", asAlpine(alpineA)), true);
    assert.equal(isPluginInitialized("share", asAlpine(alpineB)), false);
  });

  it("resetPluginRegistry() clears everything", () => {
    registerPlugin("share", definePlugin(["magic"], { names: ["share"], plugin: tracker() }));
    registerPlugin("theme", definePlugin(["store"], { names: ["theme"], plugin: tracker() }));

    resetPluginRegistry();

    assert.equal(getRegisteredPlugins().length, 0);
    assert.equal(isPluginInitialized("share", asAlpine(createMockAlpine())), false);
  });
});
