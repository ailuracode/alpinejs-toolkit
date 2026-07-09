/**
 * Tests for `@ailuracode/alpine-ui` generic storage adapters.
 *
 * Verifies both factories honour the {@link StorageAdapter} contract:
 * - Reads return typed values or `null` on miss / invalid input.
 * - Writes are best-effort and never throw on storage errors.
 * - `subscribe` fires with `null` on `remove()` and only forwards
 *   parsed values on cross-tab events.
 *
 * The localStorage store is cleared in `beforeEach` so a previous
 * test's writes cannot poison a later one.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalStorageAdapter, createMemoryAdapter } from "../src/index";

describe("createLocalStorageAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("get() returns null when the key is missing", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "missing",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    expect(storage.get()).toBeNull();
  });

  it("get() returns the parsed value when stored", () => {
    localStorage.setItem("k1", "true");
    const storage = createLocalStorageAdapter<boolean>({
      key: "k1",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    expect(storage.get()).toBe(true);
  });

  it("get() returns null when the stored value is rejected by parse", () => {
    localStorage.setItem("k2", "yes");
    const storage = createLocalStorageAdapter<boolean>({
      key: "k2",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    expect(storage.get()).toBeNull();
  });

  it("set() writes the serialized value", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k3",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    storage.set(true);
    expect(localStorage.getItem("k3")).toBe("true");
    storage.set(false);
    expect(localStorage.getItem("k3")).toBe("false");
  });

  it("remove() clears the key and get() returns null afterwards", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k4",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    storage.set(true);
    storage.remove();
    expect(localStorage.getItem("k4")).toBeNull();
    expect(storage.get()).toBeNull();
  });

  it("set() swallows SecurityError (Safari private mode)", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k5",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("SecurityError");
    };
    try {
      expect(() => storage.set(true)).not.toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it("get() returns null on SSR (no window)", () => {
    const originalWindow = globalThis.window;
    (globalThis as { window?: unknown }).window = undefined;
    try {
      const storage = createLocalStorageAdapter<boolean>({
        key: "k6",
        parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
        serialize: (value) => (value ? "true" : "false"),
      });
      expect(storage.get()).toBeNull();
      expect(() => storage.set(true)).not.toThrow();
      expect(() => storage.remove()).not.toThrow();
      expect(storage.subscribe).toBeDefined();
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    } finally {
      (globalThis as { window?: typeof originalWindow }).window = originalWindow;
    }
  });

  it("subscribe is exposed when crossTab is true (default)", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k7",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    expect(storage.subscribe).toBeDefined();
  });

  it("subscribe is a no-op when crossTab is false", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    try {
      const storage = createLocalStorageAdapter<boolean>({
        key: "k8",
        parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
        serialize: (value) => (value ? "true" : "false"),
        crossTab: false,
      });
      expect(storage.subscribe).toBeDefined();
      const listener = vi.fn();
      const unsubscribe = storage.subscribe(listener);
      const storageAdds = addSpy.mock.calls.filter(([t]) => t === "storage").length;
      expect(storageAdds).toBe(0);
      const event = new StorageEvent("storage", { key: "k8", newValue: "true" });
      window.dispatchEvent(event);
      expect(listener).not.toHaveBeenCalled();
      expect(() => unsubscribe()).not.toThrow();
    } finally {
      addSpy.mockRestore();
    }
  });

  it("subscribe forwards parsed values from cross-tab storage events", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k9",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    const event = new StorageEvent("storage", { key: "k9", newValue: "true" });
    window.dispatchEvent(event);

    expect(listener).toHaveBeenCalledWith(true);
    unsubscribe();
  });

  it("subscribe forwards null when the key is removed in another tab", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k10",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    const event = new StorageEvent("storage", { key: "k10", newValue: null });
    window.dispatchEvent(event);

    expect(listener).toHaveBeenCalledWith(null);
    unsubscribe();
  });

  it("subscribe ignores events for unrelated keys", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k11",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    const event = new StorageEvent("storage", { key: "other-key", newValue: "true" });
    window.dispatchEvent(event);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("subscribe ignores events whose newValue is rejected by parse", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k12",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    const event = new StorageEvent("storage", { key: "k12", newValue: "garbage" });
    window.dispatchEvent(event);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("unsubscribe removes the storage event listener", () => {
    const storage = createLocalStorageAdapter<boolean>({
      key: "k13",
      parse: (raw) => (raw === "true" ? true : raw === "false" ? false : null),
      serialize: (value) => (value ? "true" : "false"),
    });
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);
    unsubscribe();

    const event = new StorageEvent("storage", { key: "k13", newValue: "true" });
    window.dispatchEvent(event);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("createMemoryAdapter", () => {
  it("get() returns null when no initial value is provided", () => {
    const storage = createMemoryAdapter<boolean>();
    expect(storage.get()).toBeNull();
  });

  it("get() returns the initial value when provided", () => {
    const storage = createMemoryAdapter<boolean>({ initial: true });
    expect(storage.get()).toBe(true);
  });

  it("set() updates the stored value", () => {
    const storage = createMemoryAdapter<boolean>();
    storage.set(true);
    expect(storage.get()).toBe(true);
    storage.set(false);
    expect(storage.get()).toBe(false);
  });

  it("remove() clears the value and fires listener with null", () => {
    const storage = createMemoryAdapter<boolean>({ initial: true });
    const listener = vi.fn();
    storage.subscribe(listener);

    storage.remove();
    expect(storage.get()).toBeNull();
    expect(listener).toHaveBeenCalledWith(null);
  });

  it("remove() is a no-op when the value is already null", () => {
    const storage = createMemoryAdapter<boolean>();
    const listener = vi.fn();
    storage.subscribe(listener);

    storage.remove();
    expect(listener).not.toHaveBeenCalled();
  });

  it("subscribe fires on every set()", () => {
    const storage = createMemoryAdapter<number>();
    const listener = vi.fn();
    storage.subscribe(listener);

    storage.set(1);
    storage.set(2);
    storage.set(3);

    expect(listener).toHaveBeenNthCalledWith(1, 1);
    expect(listener).toHaveBeenNthCalledWith(2, 2);
    expect(listener).toHaveBeenNthCalledWith(3, 3);
  });

  it("subscribe returns an unsubscribe function", () => {
    const storage = createMemoryAdapter<number>();
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);

    unsubscribe();
    storage.set(1);

    expect(listener).not.toHaveBeenCalled();
  });

  it("supports complex object values via parse/serialize on the caller side", () => {
    type Pref = { sort: string; filter: string };
    const storage = createMemoryAdapter<Pref>({
      initial: { sort: "updated-desc", filter: "" },
    });
    expect(storage.get()).toEqual({ sort: "updated-desc", filter: "" });
    storage.set({ sort: "created-asc", filter: "abc" });
    assert.deepEqual(storage.get(), { sort: "created-asc", filter: "abc" });
  });

  it("multiple subscribers each receive every event", () => {
    const storage = createMemoryAdapter<string>();
    const a = vi.fn();
    const b = vi.fn();
    storage.subscribe(a);
    storage.subscribe(b);

    storage.set("hello");
    storage.remove();

    expect(a).toHaveBeenNthCalledWith(1, "hello");
    expect(a).toHaveBeenNthCalledWith(2, null);
    expect(b).toHaveBeenNthCalledWith(1, "hello");
    expect(b).toHaveBeenNthCalledWith(2, null);
  });
});

afterEach(() => {
  localStorage.clear();
});
