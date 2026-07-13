import type { QueryStore } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { createAlpineStoreAdapter } from "../src/adapter.js";
import query, { alpineStoreQueryPlugin } from "../src/index.js";

describe("@ailuracode/alpine-query-adapter-alpine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers $store.query with native Alpine.reactive", async () => {
    const Alpine = startAlpine(query({ adapter: createAlpineStoreAdapter }));
    const store = Alpine.store("query") as QueryStore;
    const queryFn = vi.fn().mockResolvedValue("native");
    const entry = store.observe(["native"], queryFn);

    await vi.runAllTimersAsync();

    expect(entry.isSuccess).toBe(true);
    expect(entry.data).toBe("native");
    entry.destroy?.();
    store.reset?.();
  });

  it("accepts a factory function as adapter", async () => {
    const Alpine = startAlpine(query({ adapter: createAlpineStoreAdapter }));
    const store = Alpine.store("query") as QueryStore;
    const queryFn = vi.fn().mockResolvedValue("factory");
    const entry = store.observe(["factory"], queryFn);

    await vi.runAllTimersAsync();

    expect(entry.data).toBe("factory");
    entry.destroy?.();
    store.reset?.();
  });

  it("alpineStoreQueryPlugin registers without options", () => {
    const Alpine = startAlpine(alpineStoreQueryPlugin());
    const store = Alpine.store("query") as QueryStore;
    expect(store).toBeDefined();
    store.reset?.();
  });
});
