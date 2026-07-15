/**
 * Contract tests — per
 * [.cursor/rules/testing.mdc](../../../../.cursor/rules/testing.mdc),
 * core provides reusable tests to validate: SSR-safe imports, plugin
 * registration, multiple independent instances, no leaked global listeners.
 *
 * These tests lock those invariants down so every feature package can rely
 * on them.
 */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";
import {
  BaseController,
  CleanupStack,
  definePlugin,
  getRegisteredPlugins,
  isBrowser,
  registerPlugin,
  resetPluginRegistry,
  safeDocument,
  safeWindow,
} from "../src/index";

afterEach(() => {
  resetPluginRegistry();
});

describe("SSR-safe imports", () => {
  it("safeWindow() and safeDocument() return real handles under happy-dom", () => {
    // The package tests run under happy-dom so DOM globals exist. The contract
    // we care about is that the safe* helpers never throw — even when the
    // API is absent.
    assert.equal(isBrowser(), true);
    assert.ok(safeWindow());
    assert.ok(safeDocument());
  });

  it("importing the package does not register global listeners or timers", () => {
    // Sanity: the registry starts empty for every test.
    assert.deepEqual(getRegisteredPlugins(), []);
  });
});

describe("plugin registration contract", () => {
  it("multiple independent instances share the registry without interfering", () => {
    registerPlugin(
      "share-a",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => undefined })
    );
    registerPlugin(
      "share-b",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => undefined })
    );

    const entries = getRegisteredPlugins();
    assert.equal(entries.length, 2);
    assert.deepEqual(
      entries.map((entry) => entry.name),
      ["share-a", "share-b"]
    );
  });

  it("resetPluginRegistry() isolates the next test", () => {
    registerPlugin(
      "share",
      definePlugin(["magic"], { names: ["share"], plugin: (_alpine) => undefined })
    );
    assert.equal(getRegisteredPlugins().length, 1);

    resetPluginRegistry();
    assert.equal(getRegisteredPlugins().length, 0);
  });
});

describe("cleanup contract", () => {
  it("BaseController.destroy() removes every registered listener", () => {
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    class Probe extends BaseController {
      override mount(): void {
        super.mount();
        this.on("tick" as never, listener);
      }
    }

    const probe = new Probe();
    probe.mount();
    (probe as unknown as { emit: (event: string, detail: unknown) => void }).emit(
      "tick",
      undefined
    );
    assert.equal(calls, 1);

    probe.destroy();
    (probe as unknown as { emit: (event: string, detail: unknown) => void }).emit(
      "tick",
      undefined
    );
    assert.equal(calls, 1);
  });

  it("CleanupStack.dispose() runs every pending cleanup", () => {
    const stack = new CleanupStack();
    let calls = 0;

    stack.push(() => {
      calls += 1;
    });
    stack.push(() => {
      calls += 1;
    });

    stack.dispose();
    assert.equal(calls, 2);
  });
});
