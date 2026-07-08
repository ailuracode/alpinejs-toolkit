/**
 * Alpine integration tests for `@ailuracode/alpine-media`.
 *
 * Per `.agents/instructions/testing.instructions.md`, plugin tests
 * cover store registration, magic exposure, reactivity, and cleanup.
 * A minimal mock Alpine exercises the contract without booting the
 * real runtime.
 */

import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import {
  createMediaStore,
  MEDIA_STORE_KEY,
  MediaController,
  type MediaStore,
  mediaIntervals,
  mediaPlugin,
} from "../src/index";
import { setMatchMedia } from "./setup";

/**
 * Strips `ontouchstart` from `window` so the controller's `isTouch`
 * heuristic consults the cached media queries only. happy-dom ships
 * with the property; the controller reads it through `'ontouchstart'
 * in win`, which checks key existence, so `value: undefined` is not
 * enough — the key has to be removed.
 */
function stripTouchEvents(): void {
  Object.defineProperty(window, "ontouchstart", { configurable: true, value: undefined });
  // biome-ignore lint/performance/noDelete: required by the heuristic contract
  delete (window as { ontouchstart?: unknown }).ontouchstart;
}

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

describe("mediaPlugin — registration", () => {
  it("registers the media store and the $media magic", () => {
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    assert.ok(Alpine.stores[MEDIA_STORE_KEY]);
    assert.ok(Alpine.magics[MEDIA_STORE_KEY]);
  });

  it("registers an Alpine cleanup callback when Alpine.cleanup is available", () => {
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    assert.equal(Alpine.cleanups.length, 1);
  });

  it("does not crash when Alpine.cleanup is missing", () => {
    interface AlpineMock {
      plugin: (cb: (alpine: AlpineMock) => void) => void;
      store(name: string, value: unknown): void;
      store(name: string): unknown;
      magic: (name: string, factory: () => unknown) => void;
    }
    const stores: Record<string, unknown> = {};
    const Alpine: AlpineMock = {
      plugin(cb) {
        cb(Alpine);
      },
      store(name, value?) {
        if (value === undefined) {
          return stores[name];
        }
        stores[name] = value;
        return undefined;
      },
      magic: () => undefined,
    };
    assert.doesNotThrow(() => mediaPlugin()(Alpine as never));
  });

  it("accepts a custom id at the plugin level", () => {
    const Alpine = createMockAlpine();
    assert.doesNotThrow(() => mediaPlugin({ id: "demo-media" })(Alpine as never));
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    assert.equal(store.id, "demo-media");
  });

  it("seeds the store with the default intervals", () => {
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    assert.equal(store.intervals.length, 2);
    assert.equal(store.intervals[0].name, "mobile");
    assert.equal(store.intervals[1].name, "desktop");
  });
});

describe("mediaPlugin — store surface", () => {
  it("mirrors controller state into the store", () => {
    setMatchMedia("(max-width: 767px)", true);
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    assert.equal(store.breakpoint, "mobile");
  });

  it("returns the same store instance through the $media magic", () => {
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const factory = Alpine.magics[MEDIA_STORE_KEY];
    const a = factory();
    const b = factory();
    assert.equal(a, b);
  });

  it("forwards refresh() to the controller", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    assert.equal(store.refresh(), false);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    assert.equal(store.refresh(), true);
    assert.equal(store.width, 500);
  });

  it("forwards refreshWidth() and refreshHeight()", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    assert.equal(store.refreshWidth(), true);
    assert.equal(store.width, 500);

    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    assert.equal(store.refreshHeight(), true);
    assert.equal(store.height, 600);
  });

  it("forwards on() subscriptions to the controller", () => {
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    let calls = 0;
    const unsubscribe = store.on("change", () => {
      calls += 1;
    });
    assert.equal(typeof unsubscribe, "function");
    unsubscribe();
    assert.equal(calls, 0);
  });
});

describe("mediaPlugin — cleanup", () => {
  it("destroys the controller when Alpine.cleanup fires", () => {
    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    assert.equal(store.isDestroyed, false);
    for (const cleanup of Alpine.cleanups) {
      cleanup();
    }
    assert.equal(store.isDestroyed, true);
  });
});

describe("mediaPlugin — Alpine reactivity", () => {
  it("bumps __revision on every change event so feature getters re-evaluate", () => {
    // Reproduces the Chrome DevTools device-toolbar scenario: the
    // viewport does NOT resize, but `(pointer: coarse)` and
    // `(hover: hover)` flip. The store proxy must register the
    // change so `x-text="$store.media.isTouch"` re-renders.
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 0 });
    stripTouchEvents();

    const Alpine = createMockAlpine();
    mediaPlugin()(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore & {
      __revision: number;
    };
    const initialRevision = store.__revision;

    // Toggle device toolbar → mobile. The controller emits a
    // `change` event with source `'viewport'`; the store mirror
    // must bump `__revision` even though `width` / `height` /
    // `breakpoint` are unchanged.
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    assert.equal(store.pointer, "coarse");
    assert.equal(store.hover, "none");
    assert.equal(store.isTouch, true);
    assert.ok(
      store.__revision > initialRevision,
      `expected __revision to bump after a feature change (was ${initialRevision}, now ${store.__revision})`
    );
  });

  it("re-renders Alpine bindings when only a media feature flips (no resize)", async () => {
    // End-to-end: mount a real Alpine `x-data` block, render an
    // `x-text` for `pointer` / `hover`, and verify the DOM updates
    // when the `(pointer: coarse)` matchMedia flips without a
    // resize. (`x-text` short-circuits on raw boolean false, so we
    // observe `pointer` and `hover` directly — they re-render iff
    // Alpine's reactive proxy invalidates the store getters.)
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 0 });
    stripTouchEvents();

    const Alpine = startAlpine(mediaPlugin());
    document.body.innerHTML = `
      <div x-data>
        <span id="pointer" x-text="$store.media.pointer"></span>
        <span id="hover" x-text="$store.media.hover"></span>
        <span id="touch" x-text="String($store.media.isTouch)"></span>
      </div>
    `;
    Alpine.initTree(document.body);
    await Alpine.nextTick();

    const touch = document.getElementById("touch");
    const pointer = document.getElementById("pointer");
    const hover = document.getElementById("hover");
    assert.ok(touch && pointer && hover);

    assert.equal(pointer.textContent, "fine");
    assert.equal(hover.textContent, "hover");
    assert.equal(touch.textContent, "false");

    // Toggle device toolbar → mobile. The viewport does NOT resize.
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);
    await Alpine.nextTick();

    assert.equal(pointer.textContent, "coarse", "pointer should re-render after matchMedia flip");
    assert.equal(hover.textContent, "none", "hover should re-render after matchMedia flip");
    assert.equal(touch.textContent, "true", "isTouch should re-render after pointer:coarse flip");
  });
});

describe("createMediaStore — direct construction", () => {
  it("builds a store from a controller", () => {
    setMatchMedia("(max-width: 767px)", true);
    const controller = new MediaController({});
    controller.mount();
    const store = createMediaStore(controller);
    assert.equal(store.breakpoint, controller.breakpoint);
    assert.equal(store.id, controller.id);
    controller.destroy();
    store.destroy();
  });
});

describe("mediaPlugin — custom intervals", () => {
  it("accepts an `as const` intervals array", () => {
    setMatchMedia("(max-width: 480px)", false);
    setMatchMedia("(max-width: 768px)", true);
    const Alpine = createMockAlpine();
    mediaPlugin({
      intervals: mediaIntervals([
        { name: "phone", maxWidth: 480 },
        { name: "tablet", maxWidth: 768 },
        { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
      ] as const),
    })(Alpine as never);
    const store = Alpine.stores[MEDIA_STORE_KEY] as MediaStore;
    assert.equal(store.breakpoint, "tablet");
  });
});
