/**
 * Tests for the Astro View Transitions adapter subpath.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "vitest";
import astroThemePlugin, {
  ASTRO_THEME_REAPPLY_EVENTS,
  astroThemePlugin as namedAstroThemePlugin,
} from "../src/astro";
import type { ThemeStore } from "../src/index";
import { setMatchMedia } from "./setup";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (Alpine: MockAlpine) => void): void;
  store(name: string, value: unknown): void;
  store(name: string): unknown;
  magic(name: string, factory: () => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    cleanups: [],
    plugin(cb) {
      cb(alpine);
    },
    store(name, value?) {
      if (value === undefined) {
        return alpine.stores[name];
      }
      alpine.stores[name] = value;
      return undefined;
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
    cleanup(cb) {
      alpine.cleanups.push(cb);
    },
  };
  return alpine;
}

const PREFERS_DARK = "(prefers-color-scheme: dark)";

describe("@ailuracode/alpine-theme/astro", () => {
  let listeners: Map<string, Set<() => void>>;
  type DocumentListener = (type: string, cb: () => void) => void;
  let originalAddEventListener: DocumentListener;
  let originalRemoveEventListener: DocumentListener;

  beforeEach(() => {
    listeners = new Map();
    const doc = document as unknown as {
      addEventListener: DocumentListener;
      removeEventListener: DocumentListener;
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
      if (
        !ASTRO_THEME_REAPPLY_EVENTS.includes(type as (typeof ASTRO_THEME_REAPPLY_EVENTS)[number])
      ) {
        originalAddEventListener(type as never, cb as never);
      }
    };
    doc.removeEventListener = (type: string, cb: () => void): void => {
      const set = listeners.get(type);
      set?.delete(cb);
      if (
        !ASTRO_THEME_REAPPLY_EVENTS.includes(type as (typeof ASTRO_THEME_REAPPLY_EVENTS)[number])
      ) {
        originalRemoveEventListener(type as never, cb as never);
      }
    };
  });

  afterEach(() => {
    const doc = document as unknown as {
      addEventListener: DocumentListener;
      removeEventListener: DocumentListener;
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

  it("exports the Astro view transition event names", () => {
    assert.deepEqual(ASTRO_THEME_REAPPLY_EVENTS, ["astro:after-swap", "astro:page-load"]);
  });

  it("registers Astro reapply listeners through the default export", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    astroThemePlugin()(Alpine as never);
    assert.equal(listeners.get("astro:after-swap")?.size, 1);
    assert.equal(listeners.get("astro:page-load")?.size, 1);
  });

  it("re-applies the theme when Astro navigation events fire", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    namedAstroThemePlugin({ defaultTheme: "dark" })(Alpine as never);
    const store = Alpine.stores.theme as ThemeStore;
    document.documentElement.classList.remove("dark");
    fire("astro:after-swap");
    assert.equal(document.documentElement.classList.contains("dark"), true);
    assert.equal(store.resolved, "dark");
  });

  it("removes Astro listeners on Alpine cleanup", () => {
    setMatchMedia(PREFERS_DARK, false);
    const Alpine = createMockAlpine();
    astroThemePlugin()(Alpine as never);
    Alpine.cleanups[0]();
    assert.equal(listeners.get("astro:after-swap")?.size ?? 0, 0);
    assert.equal(listeners.get("astro:page-load")?.size ?? 0, 0);
  });
});
