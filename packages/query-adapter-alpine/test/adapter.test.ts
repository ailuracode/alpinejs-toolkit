import type { QueryStore } from "@ailuracode/alpinejs-query";
import query from "@ailuracode/alpinejs-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { createAlpineStoreAdapter } from "../src/adapter.js";

describe("@ailuracode/alpinejs-query-adapter-alpine", () => {
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
});
