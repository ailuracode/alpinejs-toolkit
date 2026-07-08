/**
 * Type-level contract tests for {@link Alpine} and {@link PluginCallback}.
 *
 * The runtime assertions exercise a real mock Alpine so we can verify
 * the typed overloads also hold at runtime. The structural typing is
 * the real contract — if TypeScript narrows `alpine.store("counter")`
 * to `CounterStore`, the runtime mock must return the same value.
 *
 * Negative cases use `// @ts-expect-error` so the test fails the moment
 * TypeScript stops flagging the line we expected to fail.
 */
import assert from "node:assert/strict";
import type { Alpine as BaseAlpine, PluginCallback as BasePluginCallback } from "alpinejs";
import { describe, it } from "vitest";
import type { Alpine, PluginCallback } from "../src/index.ts";

interface CounterStore {
  readonly count: number;
  inc(): void;
}

interface ThemeStore {
  readonly current: "light" | "dark";
}

function createMockAlpine<TStores extends Record<string, unknown>>(seed: TStores): Alpine<TStores> {
  const stores = new Map<string, unknown>(Object.entries(seed));
  const alpine = {
    store(name: string, value?: unknown): unknown {
      if (arguments.length === 2) {
        stores.set(name, value);
        return undefined;
      }
      return stores.get(name);
    },
  };
  return alpine as unknown as Alpine<TStores>;
}

describe("Alpine<TStores> — typed store overloads", () => {
  it('Alpine<{counter: CounterStore}>.store("counter") returns CounterStore', () => {
    const counter: CounterStore = { count: 7, inc: () => undefined };
    const alpine = createMockAlpine({ counter });
    const store: CounterStore = alpine.store("counter");
    assert.equal(store.count, 7);
  });

  it('Alpine<{counter: CounterStore}>.store("counter", value) accepts CounterStore', () => {
    const alpine = createMockAlpine<{ counter: CounterStore }>({
      counter: { count: 0, inc: () => undefined },
    });
    alpine.store("counter", { count: 1, inc: () => undefined });
    assert.equal(alpine.store("counter").count, 1);
  });

  it('Alpine<{counter: CounterStore}>.store("counter", wrong) is a type error', () => {
    const alpine = createMockAlpine<{ counter: CounterStore }>({
      counter: { count: 0, inc: () => undefined },
    });
    // @ts-expect-error — CounterStore is required, not a string.
    alpine.store("counter", "not-a-store");
    assert.ok(true);
  });

  it("Alpine (no generic) is interchangeable with Base.Alpine", () => {
    const alpine: Alpine = null as unknown as Alpine;
    const baseAlpine: BaseAlpine = alpine;
    assert.equal(alpine, baseAlpine);
  });
});

describe("PluginCallback<T> — Alpine.plugin() boundary", () => {
  it("PluginCallback<BaseAlpine> is assignable to BasePluginCallback", () => {
    const callback = (_alpine: BaseAlpine): void => undefined;
    const baseCallback: BasePluginCallback = callback;
    assert.equal(typeof baseCallback, "function");
  });

  it("PluginCallback<Alpine<{counter: CounterStore}>> accepts a typed Alpine at the call site", () => {
    const alpine = createMockAlpine<{ counter: CounterStore }>({
      counter: { count: 42, inc: () => undefined },
    });
    const callback: PluginCallback<Alpine<{ counter: CounterStore }>> = (
      al: Alpine<{ counter: CounterStore }>
    ): void => {
      const counter: CounterStore = al.store("counter");
      assert.equal(counter.count, 42);
    };
    callback(alpine);
  });

  it("PluginCallback defaults to Base.Alpine when no generic is supplied", () => {
    const callback: PluginCallback = (_alpine: BaseAlpine): void => undefined;
    const asBase: BasePluginCallback = callback;
    void asBase;
    assert.ok(true);
  });
});

describe("Alpine<TStores> — multiple stores", () => {
  it("narrows every registered store key independently", () => {
    const counter: CounterStore = { count: 1, inc: () => undefined };
    const theme: ThemeStore = { current: "dark" };
    const alpine = createMockAlpine({ counter, theme });
    const counterStore: CounterStore = alpine.store("counter");
    const themeStore: ThemeStore = alpine.store("theme");
    assert.equal(counterStore.count, 1);
    assert.equal(themeStore.current, "dark");
  });
});
