import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vanillaQueryAdapter } from "../src/adapters/vanilla.js";
import { QueryCache } from "../src/cache.js";

function createCache() {
  return new QueryCache({
    adapter: vanillaQueryAdapter,
    defaultQueryOptions: {},
    defaultMutationRetry: 0,
    defaultMutationRetryDelay: 1000,
  });
}

describe("@ailuracode/alpine-query observer subscriptions", () => {
  let cache: QueryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = createCache();
  });

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it("increments observer count once per observe() call", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const first = cache.observe(["shared"], fn, { staleTime: 60_000 });
    const second = cache.observe(["shared"], fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    const entry = cache.getEntryByHash(JSON.stringify(["shared"]));
    expect(entry?.observers).toBe(2);

    first.destroy();
    expect(entry?.observers).toBe(1);

    second.destroy();
    expect(entry?.observers).toBe(0);
  });

  it("makes duplicate destroy() calls a no-op", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const first = cache.observe(["dup"], fn, { staleTime: 60_000, gcTime: 100 });
    const second = cache.observe(["dup"], fn, { staleTime: 60_000, gcTime: 100 });
    await vi.runAllTimersAsync();

    const entry = cache.getEntryByHash(JSON.stringify(["dup"]));
    const destroy = first.destroy;

    first.destroy();
    first.destroy();
    first.destroy();

    expect(entry?.observers).toBe(1);
    expect(first.destroy).toBe(destroy);

    vi.advanceTimersByTime(200);
    expect(cache.getEntries()).toHaveLength(1);

    second.destroy();
    vi.advanceTimersByTime(200);
    expect(cache.getEntries()).toHaveLength(0);
  });

  it("keeps independent destroy handles across observers", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const first = cache.observe(["handles"], fn, { staleTime: 60_000, gcTime: 100 });
    const second = cache.observe(["handles"], fn, { staleTime: 60_000, gcTime: 100 });
    await vi.runAllTimersAsync();

    const firstDestroy = first.destroy;
    const secondDestroy = second.destroy;

    expect(firstDestroy).not.toBe(secondDestroy);

    first.destroy();
    expect(second.destroy).toBe(secondDestroy);
    expect(typeof second.destroy).toBe("function");

    second.destroy();
    expect(first.destroy).toBe(firstDestroy);
  });

  it("only schedules GC after the last observer is released", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const first = cache.observe(["gc-order"], fn, { staleTime: 60_000, gcTime: 100 });
    const second = cache.observe(["gc-order"], fn, { staleTime: 60_000, gcTime: 100 });
    await vi.runAllTimersAsync();

    first.destroy();
    vi.advanceTimersByTime(200);
    expect(cache.getEntries()).toHaveLength(1);

    second.destroy();
    vi.advanceTimersByTime(50);
    expect(cache.getEntries()).toHaveLength(1);

    vi.advanceTimersByTime(100);
    expect(cache.getEntries()).toHaveLength(0);
  });

  it("cancels pending GC when re-observing during the GC window", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const first = cache.observe(["gc-window"], fn, { staleTime: 60_000, gcTime: 100 });
    await vi.runAllTimersAsync();

    first.destroy();
    vi.advanceTimersByTime(50);

    const second = cache.observe(["gc-window"], fn, { staleTime: 60_000, gcTime: 100 });
    vi.advanceTimersByTime(200);

    expect(cache.getEntries()).toHaveLength(1);
    second.destroy();
  });

  it("exposes shared state identity across observers without mutating entry.state", async () => {
    const fn = vi.fn().mockResolvedValue("shared");
    const first = cache.observe(["identity"], fn, { staleTime: 60_000 });
    const second = cache.observe(["identity"], fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    const entry = cache.getEntryByHash(JSON.stringify(["identity"]));
    if (!entry) {
      throw new Error("expected cache entry");
    }

    expect(first).not.toBe(second);
    expect(first.state).toBe(second.state);
    expect(first.state).toBe(entry.state);
    expect(first.data).toBe(second.data);
    expect("destroy" in entry.state).toBe(false);

    first.destroy();
    second.destroy();
  });

  it("reflects shared state updates on every observer facade", async () => {
    const fn = vi.fn().mockResolvedValue("fresh");
    const first = cache.observe(["updates"], fn, { staleTime: 60_000 });
    const second = cache.observe(["updates"], fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    expect(first.isSuccess).toBe(true);
    expect(second.isSuccess).toBe(true);
    expect(first.data).toBe("fresh");
    expect(second.data).toBe("fresh");

    cache.setData(["updates"], "patched");
    expect(first.data).toBe("patched");
    expect(second.data).toBe("patched");

    first.destroy();
    second.destroy();
  });
});
