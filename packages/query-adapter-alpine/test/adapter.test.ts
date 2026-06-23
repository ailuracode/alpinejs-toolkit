import type { QueryStore } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import alpineStoreQueryPlugin from "../src/index.js";

describe("@ailuracode/alpine-query-adapter-alpine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers $store.query with native Alpine.reactive", async () => {
    const Alpine = startAlpine(alpineStoreQueryPlugin());
    const store = Alpine.store("query") as QueryStore;
    const queryFn = vi.fn().mockResolvedValue("native");
    const query = store.observe(["native"], queryFn);

    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toBe("native");
    query.destroy?.();
    store.reset?.();
  });
});
