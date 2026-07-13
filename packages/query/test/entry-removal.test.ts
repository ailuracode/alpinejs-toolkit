import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QueryStateAdapter, QueryStateHandle } from "../src/adapters/types.js";
import { vanillaQueryAdapter } from "../src/adapters/vanilla.js";
import { QueryCache } from "../src/cache.js";
import type { QueryStateRecord } from "../src/state/view.js";
import type { QueryKey } from "../src/types.js";
import { hashKey } from "../src/utils.js";

type DisposalTracker = {
  disposeCount: number;
  adapter: QueryStateAdapter;
};

function createTrackingAdapter(): DisposalTracker {
  const tracker: DisposalTracker = {
    disposeCount: 0,
    adapter: {
      name: "Tracking",
      createQueryState<TData>(
        initial: QueryStateRecord<TData>,
        staleTime: number,
        refetch: () => Promise<void>
      ) {
        const base = vanillaQueryAdapter.createQueryState<TData>(initial, staleTime, refetch);
        const handle: QueryStateHandle<TData> = {
          ...base,
          dispose() {
            tracker.disposeCount += 1;
          },
        };
        return handle;
      },
      createMutationState(handlers) {
        return vanillaQueryAdapter.createMutationState(handlers);
      },
    },
  };

  return tracker;
}

function createCache(adapter: QueryStateAdapter = vanillaQueryAdapter) {
  return new QueryCache({
    adapter,
    defaultQueryOptions: {},
    defaultMutationRetry: 0,
    defaultMutationRetryDelay: 1000,
  });
}

describe("@ailuracode/alpine-query entry removal", () => {
  let cache: QueryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = createCache();
  });

  afterEach(() => {
    if (!cache.isDestroyed) {
      cache.reset();
    }
    vi.useRealTimers();
  });

  const removalPaths = [
    {
      name: "remove()",
      run: (trackedCache: QueryCache, key: QueryKey, _subscription: { destroy(): void }) => {
        trackedCache.remove(key);
      },
      options: { staleTime: 60_000 },
    },
    {
      name: "removeEntry()",
      run: (trackedCache: QueryCache, key: QueryKey) => {
        trackedCache.removeEntry(hashKey(key));
      },
      options: { staleTime: 60_000 },
    },
    {
      name: "garbage collection",
      run: (_trackedCache: QueryCache, _key: QueryKey, subscription: { destroy(): void }) => {
        subscription.destroy();
        vi.advanceTimersByTime(1001);
      },
      options: { staleTime: 60_000, gcTime: 1000 },
    },
    {
      name: "reset()",
      run: (trackedCache: QueryCache) => {
        trackedCache.reset();
      },
      options: { staleTime: 60_000 },
    },
    {
      name: "destroy()",
      run: (trackedCache: QueryCache) => {
        trackedCache.destroy();
      },
      options: { staleTime: 60_000 },
    },
  ] as const;

  for (const path of removalPaths) {
    it(`${path.name} disposes adapter handle exactly once`, async () => {
      const tracker = createTrackingAdapter();
      const trackedCache = createCache(tracker.adapter);
      const fn = vi.fn().mockResolvedValue("data");
      const key = ["tracked", path.name] as const;

      const subscription = trackedCache.observe(key, fn, path.options);
      await vi.runAllTimersAsync();

      path.run(trackedCache, key, subscription);

      expect(tracker.disposeCount).toBe(1);
      expect(trackedCache.getEntries()).toHaveLength(0);

      trackedCache.removeEntry(hashKey(key));
      trackedCache.remove(key);
      expect(tracker.disposeCount).toBe(1);

      if (!trackedCache.isDestroyed) {
        trackedCache.destroy();
      }
    });
  }

  it("removeEntry stops devtools notifications from disposed entries", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const key = ["devtools-stop"] as const;
    const subscription = cache.observe(key, fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    const listener = vi.fn();
    const unsubscribe = cache.getDevtools().subscribe(listener);
    listener.mockClear();

    cache.removeEntry(hashKey(key));

    listener.mockClear();
    subscription.destroy();
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });

  it("remove with active observers detaches entry and makes destroy() a no-op", async () => {
    const fn = vi.fn().mockResolvedValue("data");
    const key = ["active-obs"] as const;
    const subscription = cache.observe(key, fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    const entry = cache.getEntryByHash(hashKey(key));
    expect(entry?.observers).toBe(1);

    cache.remove(key);

    expect(cache.get(key)).toBeUndefined();
    expect(entry?.observers).toBe(1);

    expect(() => subscription.destroy()).not.toThrow();
    expect(cache.getEntries()).toHaveLength(0);
  });

  it("remove aborts in-flight requests", async () => {
    const abortSignals: AbortSignal[] = [];
    const fn = vi.fn(({ signal }: { signal: AbortSignal }) => {
      abortSignals.push(signal);
      return new Promise<string>(() => {
        // never resolves
      });
    });

    const key = ["in-flight"] as const;
    cache.observe(key, fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    expect(abortSignals).toHaveLength(1);
    expect(abortSignals[0]?.aborted).toBe(false);

    cache.remove(key);

    expect(abortSignals[0]?.aborted).toBe(true);
  });

  it("duplicate removeEntry calls do not double-dispose", async () => {
    const tracker = createTrackingAdapter();
    const trackedCache = createCache(tracker.adapter);
    const fn = vi.fn().mockResolvedValue("data");
    const key = ["dup"] as const;

    trackedCache.observe(key, fn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    const keyHash = hashKey(key);
    trackedCache.removeEntry(keyHash);
    trackedCache.removeEntry(keyHash);

    expect(tracker.disposeCount).toBe(1);
    trackedCache.destroy();
  });

  it("reset with active observers syncs focus listeners", () => {
    const windowTracker = { remove: vi.fn() };
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: windowTracker.remove,
    });
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    cache.observe(["focus-reset"], vi.fn().mockResolvedValue([]));
    cache.reset();

    expect(windowTracker.remove).toHaveBeenCalledWith("focus", expect.any(Function));
    vi.unstubAllGlobals();
  });
});
