/**
 * `$persist` helper tests for `@ailuracode/alpine-sidebar` v2.1.0.
 *
 * Exercises `persistSidebarVisible` and `withSidebarVisiblePersist`
 * with a lightweight mock `Alpine`. The mock is constructed in-test
 * to keep the spec self-contained — no global state leaks between
 * cases.
 *
 * 7 tests map to the spec matrix §4.2 rows #17–#23.
 */

import assert from "node:assert/strict";
import { describe, it, vi } from "vitest";
import {
  persistSidebarVisible,
  type SidebarAlpineLike,
  withSidebarVisiblePersist,
} from "../src/index";

/**
 * Minimal mock `Alpine` runtime. `$persist(...)` returns a chainable
 * proxy whose `.as(key)` returns a stable handle — tests inspect the
 * chain to confirm the helper forwarded the right key.
 */
function createMockAlpine(
  opts: { hasPersist?: boolean; storeValue?: unknown } = {}
): SidebarAlpineLike & {
  persistCalls: Array<{ args: unknown[] }>;
  asCalls: Array<{ key: string }>;
  storeCalls: Array<{ name: string }>;
} {
  const hasPersist = opts.hasPersist !== false;
  const storeValue = opts.storeValue;
  const persistCalls: Array<{ args: unknown[] }> = [];
  const asCalls: Array<{ key: string }> = [];
  const storeCalls: Array<{ name: string }> = [];
  const proxy = { __isMockProxy: true } as Record<string, unknown> & Record<symbol, unknown>;

  const mock = {
    persistCalls,
    asCalls,
    storeCalls,
    store(name: string): unknown {
      storeCalls.push({ name });
      if (storeValue === undefined) {
        return undefined;
      }
      if (typeof storeValue === "object" && storeValue !== null) {
        return { ...(storeValue as object) };
      }
      return storeValue;
    },
    $persist: hasPersist
      ? (...args: unknown[]): unknown => {
          persistCalls.push({ args });
          const builder = {
            as: (key: string): unknown => {
              asCalls.push({ key });
              return proxy;
            },
          };
          return builder;
        }
      : undefined,
  };
  return mock as unknown as SidebarAlpineLike & {
    persistCalls: Array<{ args: unknown[] }>;
    asCalls: Array<{ key: string }>;
    storeCalls: Array<{ name: string }>;
  };
}

describe("persistSidebarVisible", () => {
  it("plugin loaded + store registered → wraps store.visible and returns true", () => {
    const Alpine = createMockAlpine({ storeValue: { visible: false } });
    const result = persistSidebarVisible(Alpine);
    assert.equal(result, true);
    assert.equal(Alpine.storeCalls.length, 1);
    assert.equal(Alpine.storeCalls[0].name, "sidebar");
    assert.equal(Alpine.persistCalls.length, 1);
    // Seed value is the current `visible` (false).
    assert.deepEqual(Alpine.persistCalls[0].args, [false]);
    // Default key was used.
    assert.equal(Alpine.asCalls[0].key, "sidebar-visible");
  });

  it("Alpine.$persist undefined → returns false silently; no throw", () => {
    const Alpine = createMockAlpine({ hasPersist: false, storeValue: { visible: false } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const result = persistSidebarVisible(Alpine);
      assert.equal(result, false);
      assert.equal(warn.mock.calls.length, 0);
    } finally {
      warn.mockRestore();
    }
  });

  it("Alpine.$persist undefined + strict:true → throws ToolkitError", () => {
    const Alpine = createMockAlpine({ hasPersist: false, storeValue: { visible: false } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      assert.throws(
        () => persistSidebarVisible(Alpine, { strict: true }),
        /@alpinejs\/persist plugin not detected/
      );
      assert.equal(warn.mock.calls.length, 0);
    } finally {
      warn.mockRestore();
    }
  });

  it("Alpine.store('sidebar') missing → returns false silently; no throw", () => {
    const Alpine = createMockAlpine({ storeValue: undefined });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const result = persistSidebarVisible(Alpine);
      assert.equal(result, false);
      assert.equal(warn.mock.calls.length, 0);
    } finally {
      warn.mockRestore();
    }
  });

  it("Alpine.store('sidebar') missing + strict:true → throws ToolkitError", () => {
    const Alpine = createMockAlpine({ storeValue: undefined });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      assert.throws(
        () => persistSidebarVisible(Alpine, { strict: true }),
        /register sidebarPlugin/
      );
      assert.equal(warn.mock.calls.length, 0);
    } finally {
      warn.mockRestore();
    }
  });

  it("custom key flows through to Alpine.$persist as first arg of .as()", () => {
    const Alpine = createMockAlpine({ storeValue: { visible: true } });
    const result = persistSidebarVisible(Alpine, { key: "my-sidebar" });
    assert.equal(result, true);
    assert.equal(Alpine.asCalls[0].key, "my-sidebar");
  });
});

describe("withSidebarVisiblePersist", () => {
  it("proxy.visible reads from store.visible", () => {
    const store = { visible: true };
    const proxy = withSidebarVisiblePersist(store);
    assert.equal(proxy.visible, true);
  });

  it("proxy.visible = X writes to store.visible", () => {
    const store = { visible: true };
    const proxy = withSidebarVisiblePersist(store);
    proxy.visible = false;
    assert.equal(store.visible, false);
  });

  it("options is accepted without affecting proxy behaviour (forward-compat)", () => {
    const store = { visible: false };
    const proxy = withSidebarVisiblePersist(store, { key: "k" });
    assert.equal(proxy.visible, false);
    proxy.visible = true;
    assert.equal(store.visible, true);
  });
});
