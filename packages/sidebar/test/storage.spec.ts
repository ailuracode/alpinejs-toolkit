/**
 * Storage-adapter tests for `@ailuracode/alpine-sidebar` v2.1.0.
 *
 * Verifies each adapter implements the {@link SidebarStorage} contract
 * exactly: reads return typed booleans, writes are best-effort,
 * invalid stored values are ignored, cross-tab events flow through
 * a `subscribe` listener.
 *
 * 15 localStorage adapter specs + 5 memory adapter specs map to the
 * spec matrix §4.1 rows #1–#15 + the §3.2 memory contract.
 *
 * The localStorage store is cleared in `beforeEach` so a previous
 * test's writes cannot poison a later one. The shared `test/setup.ts`
 * does NOT clear `localStorage` by design — only this spec needs the
 * hermetic teardown.
 */

import assert from "node:assert/strict";
import { beforeEach, describe, it, vi } from "vitest";
import { createLocalStorageSidebarStorage, createMemorySidebarStorage } from "../src/index";

describe("createLocalStorageSidebarStorage", () => {
  beforeEach(() => {
    // Hermetic teardown — the shared setup does not clear
    // localStorage, so this spec owns the lifecycle.
    localStorage.clear();
  });

  it("get() returns null when the key is missing", () => {
    const storage = createLocalStorageSidebarStorage({ key: "missing" });
    assert.equal(storage.get(), null);
  });

  it("get() returns true when stored 'true'", () => {
    localStorage.setItem("k1", "true");
    const storage = createLocalStorageSidebarStorage({ key: "k1" });
    assert.equal(storage.get(), true);
  });

  it("get() returns false when stored 'false'", () => {
    localStorage.setItem("k2", "false");
    const storage = createLocalStorageSidebarStorage({ key: "k2" });
    assert.equal(storage.get(), false);
  });

  it("get() returns null when stored 'yes' (invalid value)", () => {
    localStorage.setItem("k3", "yes");
    const storage = createLocalStorageSidebarStorage({ key: "k3" });
    assert.equal(storage.get(), null);
  });

  it("set(true) writes the literal string 'true' to localStorage", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k4" });
    storage.set(true);
    assert.equal(localStorage.getItem("k4"), "true");
  });

  it("set(false) writes the literal string 'false' to localStorage", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k5" });
    storage.set(false);
    assert.equal(localStorage.getItem("k5"), "false");
  });

  it("remove() clears the localStorage key", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k6" });
    storage.set(true);
    assert.equal(localStorage.getItem("k6"), "true");
    storage.remove();
    assert.equal(localStorage.getItem("k6"), null);
    assert.equal(storage.get(), null);
  });

  it("set() swallows SecurityError (Safari private mode)", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k7" });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("SecurityError");
    };
    try {
      assert.doesNotThrow(() => storage.set(true));
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("get() swallows read errors and returns null", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k8" });
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("SecurityError");
    };
    try {
      assert.equal(storage.get(), null);
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it("subscribe forwards storage events for the same key", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k9" });
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });
    assert.ok(unsubscribe);

    window.dispatchEvent(new StorageEvent("storage", { key: "k9", newValue: "true" }));
    assert.deepEqual(seen, [true]);
    unsubscribe?.();
  });

  it("subscribe forwards newValue:null as null (cleared in another tab)", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k10" });
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });

    window.dispatchEvent(new StorageEvent("storage", { key: "k10", newValue: null }));
    assert.deepEqual(seen, [null]);
    unsubscribe?.();
  });

  it("subscribe ignores events for unrelated keys", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k11" });
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });

    window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "true" }));
    assert.equal(seen.length, 0);
    unsubscribe?.();
  });

  it("subscribe drops events with invalid newValue (forwards only valid)", () => {
    const storage = createLocalStorageSidebarStorage({ key: "k12" });
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });

    window.dispatchEvent(new StorageEvent("storage", { key: "k12", newValue: "maybe" }));
    assert.equal(seen.length, 0);
    unsubscribe?.();
  });

  it("crossTab:false returns a no-op Unsubscribe without registering a listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    try {
      const storage = createLocalStorageSidebarStorage({ key: "k13", crossTab: false });
      const seen: Array<boolean | null> = [];
      const unsubscribe = storage.subscribe?.((next) => {
        seen.push(next);
      });
      assert.ok(unsubscribe);

      // No `storage` listener was registered.
      const storageAdds = addSpy.mock.calls.filter(([t]) => t === "storage").length;
      assert.equal(storageAdds, 0);

      // Dispatching an event does NOT invoke the listener.
      window.dispatchEvent(new StorageEvent("storage", { key: "k13", newValue: "true" }));
      assert.equal(seen.length, 0);
      unsubscribe?.();
    } finally {
      addSpy.mockRestore();
    }
  });

  it("SSR (no window) — all methods are inert no-ops without throwing", () => {
    const originalWindow = globalThis.window;
    (globalThis as { window?: unknown }).window = undefined;
    try {
      const storage = createLocalStorageSidebarStorage({ key: "k14" });
      assert.doesNotThrow(() => storage.get());
      assert.doesNotThrow(() => storage.set(true));
      assert.doesNotThrow(() => storage.remove());
      const unsubscribe = storage.subscribe?.(() => {
        assert.fail("listener should not run under SSR");
      });
      assert.ok(unsubscribe);
      assert.doesNotThrow(() => unsubscribe?.());
      assert.equal(storage.get(), null);
    } finally {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });
});

describe("createMemorySidebarStorage", () => {
  it("starts null when no initial value is supplied", () => {
    const storage = createMemorySidebarStorage();
    assert.equal(storage.get(), null);
  });

  it("starts true when initial:true is supplied", () => {
    const storage = createMemorySidebarStorage(true);
    assert.equal(storage.get(), true);
  });

  it("set then get round-trips the last written value", () => {
    const storage = createMemorySidebarStorage();
    storage.set(true);
    assert.equal(storage.get(), true);
    storage.set(false);
    assert.equal(storage.get(), false);
  });

  it("subscribe receives every set and remove", () => {
    const storage = createMemorySidebarStorage();
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe((next) => {
      seen.push(next);
    });
    storage.set(true);
    storage.remove();
    assert.deepEqual(seen, [true, null]);
    unsubscribe();
  });

  it("remove() from null is a no-op (no listener fire)", () => {
    const storage = createMemorySidebarStorage();
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe((next) => {
      seen.push(next);
    });
    storage.remove();
    assert.deepEqual(seen, []);
    unsubscribe();
  });

  it("unsubscribe detaches the listener cleanly", () => {
    const storage = createMemorySidebarStorage();
    const seen: Array<boolean | null> = [];
    const unsubscribe = storage.subscribe((next) => {
      seen.push(next);
    });
    unsubscribe();
    storage.set(true);
    storage.remove();
    assert.deepEqual(seen, []);
  });
});
