/**
 * Tests for the registry's `load-error` diagnostic event.
 *
 * The registry surfaces one diagnostic event only: when a plugin
 * loader throws or returns a non-function. Lifecycle events
 * (`register` / `unregister` / `install` / etc.) are intentionally
 * not emitted — they duplicate call sites and add noise. Toolkit
 * errors with stable codes (`PLUGIN_LOADER_INVALID`, …) cover
 * the diagnostic surface that actually matters.
 */
import assert from "node:assert/strict";
import type { Alpine } from "alpinejs";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  definePlugin,
  getRegistryDebugSink,
  initPlugins,
  initPluginsSync,
  type RegistryEventLike,
  registerPlugin,
  resetPluginRegistry,
  setRegistryDebugSink,
} from "../src/index";

/** Matches the loader-error reason emitted for a non-function return value. */
const LOADER_ERROR_REGEX = /function/;
/** Matches the loader-error reason emitted when a factory throws. */
const LOADER_BOOM_REGEX = /boom/;

interface MockAlpine {
  pluginCalls: Array<(Alpine: MockAlpine) => void>;
  plugin(callback: (Alpine: MockAlpine) => void): void;
  magic(_name: string, _callback: () => unknown): void;
  store(_name: string, _callback: () => unknown): void;
}

function createMockAlpine(): MockAlpine {
  return {
    pluginCalls: [],
    plugin(callback) {
      (this as MockAlpine).pluginCalls.push(callback);
    },
    magic(_name, _callback) {
      /* noop */
    },
    store(_name, _callback) {
      /* noop */
    },
  };
}

function asAlpine(mock: MockAlpine): Alpine {
  return mock as unknown as Alpine;
}

beforeEach(() => {
  resetPluginRegistry();
  setRegistryDebugSink(null);
});

afterEach(() => {
  resetPluginRegistry();
  setRegistryDebugSink(null);
});

describe("registry load-error events", () => {
  it("emits a load-error event when the sync loader returns a non-function", () => {
    const events: RegistryEventLike[] = [];
    setRegistryDebugSink((event) => {
      events.push(event);
    });

    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: () => ({}) as never,
      })
    );

    const Alpine = createMockAlpine();
    assert.throws(() => initPluginsSync(asAlpine(Alpine)));

    const errorEvent = events.find((event) => event.action === "load-error");
    assert.ok(errorEvent);
    assert.equal(errorEvent?.plugin, "broken");
    assert.match(errorEvent?.reason ?? "", LOADER_ERROR_REGEX);
  });

  it("emits a load-error event when the sync loader factory throws", () => {
    const events: RegistryEventLike[] = [];
    setRegistryDebugSink((event) => {
      events.push(event);
    });

    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: () => {
          throw new Error("boom");
        },
      })
    );

    const Alpine = createMockAlpine();
    assert.throws(() => initPluginsSync(asAlpine(Alpine)));

    const errorEvent = events.find((event) => event.action === "load-error");
    assert.ok(errorEvent);
    assert.equal(errorEvent?.plugin, "broken");
    assert.match(errorEvent?.reason ?? "", LOADER_BOOM_REGEX);
  });

  it("emits a load-error event when the async loader returns a non-function", async () => {
    const events: RegistryEventLike[] = [];
    setRegistryDebugSink((event) => {
      events.push(event);
    });

    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: () => Promise.resolve({}) as never,
      })
    );

    const Alpine = createMockAlpine();
    await assert.rejects(() => initPlugins(asAlpine(Alpine)));

    const errorEvent = events.find((event) => event.action === "load-error");
    assert.ok(errorEvent);
    assert.equal(errorEvent?.plugin, "broken");
    assert.match(errorEvent?.reason ?? "", LOADER_ERROR_REGEX);
  });

  it("does NOT emit a load-error event when the loader resolves successfully", () => {
    const events: RegistryEventLike[] = [];
    setRegistryDebugSink((event) => {
      events.push(event);
    });

    registerPlugin(
      "share",
      definePlugin(["magic"], {
        names: ["share"],
        plugin: () => () => undefined,
      })
    );

    const Alpine = createMockAlpine();
    initPluginsSync(asAlpine(Alpine));

    assert.equal(events.length, 0);
  });

  it("does NOT emit any event when no sink is wired", () => {
    // Sanity check: getRegistryDebugSink is null, no logger crashes.
    assert.equal(getRegistryDebugSink(), null);

    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: () => ({}) as never,
      })
    );

    const Alpine = createMockAlpine();
    assert.throws(() => initPluginsSync(asAlpine(Alpine)));
  });

  it("survives a throwing sink without breaking the loader", () => {
    setRegistryDebugSink((() => {
      throw new Error("logger is on fire");
    }) as never);

    registerPlugin(
      "broken",
      definePlugin(["magic"], {
        names: ["broken"],
        plugin: () => ({}) as never,
      })
    );

    const Alpine = createMockAlpine();
    // The ToolkitError must still be thrown even though the sink blew up.
    assert.throws(() => initPluginsSync(asAlpine(Alpine)));
  });
});
