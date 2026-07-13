/**
 * Unit tests for {@link bindThemeReapplyEvents}.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "vitest";
import { createTheme } from "../src/controller";
import { bindThemeReapplyEvents } from "../src/reapply-events";
import { setMatchMedia } from "./setup";

const PREFERS_DARK = "(prefers-color-scheme: dark)";

describe("bindThemeReapplyEvents", () => {
  let listeners: Map<string, Set<() => void>>;
  type TargetListener = (type: string, cb: () => void) => void;
  let originalAddEventListener: TargetListener;
  let originalRemoveEventListener: TargetListener;

  beforeEach(() => {
    listeners = new Map();
    const doc = document as unknown as {
      addEventListener: TargetListener;
      removeEventListener: TargetListener;
    };
    originalAddEventListener = doc.addEventListener.bind(doc);
    originalRemoveEventListener = doc.removeEventListener.bind(doc);
    doc.addEventListener = (type: string, cb: () => void): void => {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(cb);
    };
    doc.removeEventListener = (type: string, cb: () => void): void => {
      listeners.get(type)?.delete(cb);
    };
  });

  afterEach(() => {
    const doc = document as unknown as {
      addEventListener: TargetListener;
      removeEventListener: TargetListener;
    };
    doc.addEventListener = originalAddEventListener;
    doc.removeEventListener = originalRemoveEventListener;
  });

  function fire(type: string): void {
    const set = listeners.get(type);
    if (!set) {
      throw new Error(`No listeners registered for ${type}`);
    }
    for (const cb of set) {
      cb();
    }
  }

  it("registers apply() on each configured event", () => {
    setMatchMedia(PREFERS_DARK, false);
    const manager = createTheme({ defaultTheme: "dark" });
    const teardown = bindThemeReapplyEvents(manager, ["custom:nav", "custom:swap"]);
    assert.equal(listeners.get("custom:nav")?.size, 1);
    assert.equal(listeners.get("custom:swap")?.size, 1);
    document.documentElement.classList.remove("dark");
    fire("custom:nav");
    assert.equal(document.documentElement.classList.contains("dark"), true);
    teardown();
    assert.equal(listeners.get("custom:nav")?.size ?? 0, 0);
    assert.equal(listeners.get("custom:swap")?.size ?? 0, 0);
    manager.destroy();
  });

  it("returns a no-op teardown when events is empty", () => {
    setMatchMedia(PREFERS_DARK, false);
    const manager = createTheme({ defaultTheme: "light" });
    const teardown = bindThemeReapplyEvents(manager, []);
    assert.doesNotThrow(() => teardown());
    manager.destroy();
  });
});
