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
import {
  createMediaStore,
  MEDIA_STORE_KEY,
  MediaController,
  type MediaStore,
  mediaIntervals,
  mediaPlugin,
} from "../src/index";
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
