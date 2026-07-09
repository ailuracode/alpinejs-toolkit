/**
 * Storage-adapter tests for `@ailuracode/alpine-theme`.
 *
 * Verifies each adapter implements the {@link ThemeStorage} contract
 * exactly: reads return typed preferences, writes are best-effort,
 * invalid stored values are ignored.
 */

import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { createLocalStorageThemeStorage, createMemoryThemeStorage } from "../src/index";

/**
 * Builds a synthetic `storage` event with `key` + `newValue` and
 * dispatches it on `window`. Avoids `new StorageEvent(type, init)`
 * because some runtimes (and static analyzers like CodeQL) flag
 * the init object as a "superfluous trailing argument" — the
 * property setters on a plain `Event` are the supported path.
 */
function fireStorage(key: string, newValue: string | null): void {
  const event = new Event("storage");
  Object.defineProperty(event, "key", { value: key });
  Object.defineProperty(event, "newValue", { value: newValue });
  window.dispatchEvent(event);
}

describe("createLocalStorageThemeStorage", () => {
  it("returns null when nothing is stored", () => {
    const storage = createLocalStorageThemeStorage();
    assert.equal(storage.get(), null);
  });

  it("roundtrips every valid preference", () => {
    const storage = createLocalStorageThemeStorage({ key: "roundtrip" });
    for (const value of ["light", "dark", "system"] as const) {
      storage.set(value);
      assert.equal(storage.get(), value);
    }
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem("theme", "neon");
    const storage = createLocalStorageThemeStorage();
    assert.equal(storage.get(), null);
  });

  it("respects a custom key", () => {
    const storage = createLocalStorageThemeStorage({ key: "app-theme" });
    storage.set("dark");
    assert.equal(localStorage.getItem("app-theme"), "dark");
    assert.equal(localStorage.getItem("theme"), null);
  });

  it("removes the stored value", () => {
    const storage = createLocalStorageThemeStorage({ key: "removable" });
    storage.set("dark");
    storage.remove();
    assert.equal(storage.get(), null);
  });

  it("emits via subscribe when the storage event fires", () => {
    const storage = createLocalStorageThemeStorage({ key: "cross-tab" });
    const seen: Array<string | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });
    assert.ok(unsubscribe);

    fireStorage("cross-tab", "dark");
    assert.deepEqual(seen, ["dark"]);
    unsubscribe?.();
  });

  it("subscribe ignores events for other keys", () => {
    const storage = createLocalStorageThemeStorage({ key: "mine" });
    const seen: Array<string | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });

    fireStorage("other", "dark");
    assert.equal(seen.length, 0);
    unsubscribe?.();
  });

  it("subscribe cleans up on unsubscribe", () => {
    const storage = createLocalStorageThemeStorage({ key: "cleanup" });
    const seen: Array<string | null> = [];
    const unsubscribe = storage.subscribe?.((next) => {
      seen.push(next);
    });
    unsubscribe?.();

    fireStorage("cleanup", "light");
    assert.equal(seen.length, 0);
  });

  it("survives a SecurityError on get", () => {
    const storage = createLocalStorageThemeStorage({ key: "protected" });
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

  it("survives a SecurityError on set", () => {
    const storage = createLocalStorageThemeStorage({ key: "protected" });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("SecurityError");
    };
    try {
      assert.doesNotThrow(() => storage.set("dark"));
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});

describe("createMemoryThemeStorage", () => {
  it("starts at the initial value when supplied", () => {
    const storage = createMemoryThemeStorage("dark");
    assert.equal(storage.get(), "dark");
  });

  it("starts null when no initial value is supplied", () => {
    const storage = createMemoryThemeStorage();
    assert.equal(storage.get(), null);
  });

  it("roundtrips values", () => {
    const storage = createMemoryThemeStorage();
    storage.set("light");
    assert.equal(storage.get(), "light");
  });

  it("notifies subscribers on set", () => {
    const storage = createMemoryThemeStorage();
    const seen: Array<string | null> = [];
    const unsubscribe = storage.subscribe((next) => {
      seen.push(next);
    });
    storage.set("dark");
    assert.deepEqual(seen, ["dark"]);
    unsubscribe();
  });

  it("clears the value on remove", () => {
    const storage = createMemoryThemeStorage("dark");
    storage.remove();
    assert.equal(storage.get(), null);
  });

  it("notifies subscribers with null on remove", () => {
    const storage = createMemoryThemeStorage("dark");
    const seen: Array<string | null> = [];
    const unsubscribe = storage.subscribe((next) => {
      seen.push(next);
    });
    storage.remove();
    assert.deepEqual(seen, [null]);
    unsubscribe();
  });

  it("does not notify on remove when the value was already null", () => {
    const storage = createMemoryThemeStorage();
    const seen: Array<string | null> = [];
    const unsubscribe = storage.subscribe((next) => {
      seen.push(next);
    });
    storage.remove();
    assert.deepEqual(seen, []);
    unsubscribe();
  });
});
