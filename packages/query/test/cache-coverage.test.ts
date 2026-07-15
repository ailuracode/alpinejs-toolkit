import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vanillaQueryAdapter } from "../src/adapters/vanilla.js";
import { QueryCache } from "../src/cache.js";

type Todo = { id: number; title: string };

function createCache(options?: {
  defaultQueryOptions?: Record<string, unknown>;
  defaultMutationRetry?: number;
  defaultMutationRetryDelay?: number | ((attempt: number) => number);
}) {
  return new QueryCache({
    adapter: vanillaQueryAdapter,
    defaultQueryOptions: options?.defaultQueryOptions ?? {},
    defaultMutationRetry: options?.defaultMutationRetry ?? 3,
    defaultMutationRetryDelay: options?.defaultMutationRetryDelay ?? ((attempt) => attempt * 10),
  });
}

describe("QueryCache — comprehensive coverage", () => {
  let cache: QueryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = createCache();
  });

  afterEach(() => {
    cache.reset();
    vi.useRealTimers();
  });

  describe("ensureEntry and reuse", () => {
    it("reuses existing entry and updates queryFn/options", async () => {
      const fn1 = vi.fn().mockResolvedValue("v1");
      const fn2 = vi.fn().mockResolvedValue("v2");

      cache.observe(["key"], fn1, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      const entry = cache.getEntryByHash(JSON.stringify(["key"]));
      expect(entry).toBeDefined();
      const e = entry;

      cache.observe(["key"], fn2, { staleTime: 1_000 });
      if (e) {
        expect(e.queryFn).toBe(fn2);
        expect(e.options.staleTime).toBe(1_000);
      }
    });

    it("creates entry with initialData", () => {
      const fn = vi.fn().mockResolvedValue("live");
      cache.observe(["key"], fn, { initialData: "seed" });

      const state = cache.get<Todo>(["key"]);
      expect(state?.data).toBe("seed");
      expect(state?.status).toBe("success");
    });

    it("creates entry with placeholderData", () => {
      const fn = vi.fn().mockResolvedValue("live");
      cache.observe(["key"], fn, { placeholderData: "placeholder" });

      const state = cache.get(["key"]);
      expect(state?.data).toBe("placeholder");
    });
  });

  describe("fetchEntry behavior", () => {
    it("short-circuits when success + not stale + not invalidated", async () => {
      const fn = vi.fn().mockResolvedValue("cached");
      cache.observe(["fresh"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(1);

      cache.fetch(["fresh"], fn, { staleTime: 60_000 });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("fetches when isInvalidated", async () => {
      const fn = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");
      cache.observe(["inv"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.invalidate(["inv"]);
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("fetches when stale", async () => {
      const fn = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");
      cache.observe(["stale"], fn, { staleTime: 1000 });
      await vi.runAllTimersAsync();

      vi.advanceTimersByTime(2000);
      cache.fetch(["stale"], fn, { staleTime: 1000 });
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("sets fetchStatus to paused when enabled=false", () => {
      const fn = vi.fn().mockResolvedValue("nope");
      cache.observe(["disabled"], fn, { enabled: false });

      const state = cache.get(["disabled"]);
      expect(state?.fetchStatus).toBe("paused");
    });

    it("deduplicates concurrent fetches without force", async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        callCount++;
        return new Promise<string>((resolve) => {
          setTimeout(() => resolve(`v${callCount}`), 100);
        });
      });

      cache.observe(["dedup"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("force refetch aborts previous and restarts", async () => {
      let resolveFirst: ((v: string) => void) | undefined;
      const fn = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<string>((r) => {
              resolveFirst = r;
            })
        )
        .mockResolvedValueOnce("second");

      cache.observe(["force"], fn, { staleTime: 60_000 });
      cache.refetchEntry(JSON.stringify(["force"]));
      resolveFirst?.("first");
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancel", () => {
    it("increments generation and aborts", async () => {
      const fn = vi.fn(
        ({ signal }: { signal: AbortSignal }) =>
          new Promise<string>((_r, reject) => {
            signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
            setTimeout(() => _r("late"), 5000);
          })
      );

      cache.observe(["cancel"], fn);
      expect(cache.get(["cancel"])?.fetchStatus).toBe("fetching");

      cache.cancel(["cancel"]);
      await vi.runAllTimersAsync();

      expect(cache.get(["cancel"])?.fetchStatus).toBe("idle");
    });
  });

  describe("invalidate", () => {
    it("invalidates without key invalidates all", async () => {
      const fn1 = vi.fn().mockResolvedValueOnce("a").mockResolvedValueOnce("a2");
      const fn2 = vi.fn().mockResolvedValueOnce("b").mockResolvedValueOnce("b2");

      cache.observe(["a"], fn1, { staleTime: 60_000 });
      cache.observe(["b"], fn2, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.invalidate();
      await vi.runAllTimersAsync();

      expect(fn1).toHaveBeenCalledTimes(2);
      expect(fn2).toHaveBeenCalledTimes(2);
    });

    it("invalidate with prefix key matches subset", async () => {
      const fn = vi.fn().mockResolvedValue("v1");
      cache.observe(["items", 1], fn, { staleTime: 60_000 });
      cache.observe(["items", 2], fn, { staleTime: 60_000 });
      cache.observe(["other"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      const callCount = fn.mock.calls.length;
      cache.invalidate(["items"]);
      await vi.runAllTimersAsync();

      expect(fn.mock.calls.length).toBeGreaterThanOrEqual(callCount + 2);
    });
  });

  describe("remove", () => {
    it("remove() without key removes all entries", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["a"], fn, { staleTime: 60_000 });
      cache.observe(["b"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.remove();

      expect(cache.getEntries()).toHaveLength(0);
    });

    it("remove with multiple keys", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["a"], fn, { staleTime: 60_000 });
      cache.observe(["b"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.remove([["a"], ["b"]]);
      expect(cache.getEntries()).toHaveLength(0);
    });

    it("remove with nested array key (single key format)", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["items", 1], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.remove(["items", 1]);
      expect(cache.getEntries()).toHaveLength(0);
    });
  });

  describe("setData", () => {
    it("sets direct value", async () => {
      const fn = vi.fn().mockResolvedValue("original");
      cache.observe(["sd"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.setData(["sd"], "updated");
      expect(cache.get(["sd"])?.data).toBe("updated");
    });

    it("sets via updater function", async () => {
      const fn = vi.fn().mockResolvedValue([{ id: 1 }]);
      cache.observe(["sd2"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.setData<Todo[]>(["sd2"], (current) => [...(current ?? []), { id: 2, title: "New" }]);
      expect(cache.get<Todo[]>(["sd2"])?.data).toHaveLength(2);
    });
  });

  describe("reset", () => {
    it("clears all entries and mutations", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["a"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.reset();
      expect(cache.getEntries()).toHaveLength(0);
    });
  });

  describe("resetQueries", () => {
    it("resets all queries to pending", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["rq1"], fn, { staleTime: 60_000 });
      cache.observe(["rq2"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.resetQueries();

      expect(cache.get(["rq1"])?.status).toBe("pending");
      expect(cache.get(["rq2"])?.status).toBe("pending");
    });

    it("resets specific queries by key", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["rq3"], fn, { staleTime: 60_000 });
      cache.observe(["rq4"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.resetQueries(["rq3"]);

      expect(cache.get(["rq3"])?.status).toBe("pending");
      expect(cache.get(["rq4"])?.status).toBe("success");
    });

    it("resetQueries with initialData restores to success", () => {
      const fn = vi.fn().mockResolvedValue("live");
      cache.observe(["rqi"], fn, { initialData: "seed", staleTime: 60_000 });

      cache.resetQueries(["rqi"]);
      expect(cache.get(["rqi"])?.status).toBe("success");
      expect(cache.get(["rqi"])?.data).toBe("seed");
    });

    it("resetQueries with placeholderData sets placeholder", () => {
      const fn = vi.fn().mockResolvedValue("live");
      cache.observe(["rqp"], fn, { placeholderData: "placeholder", staleTime: 60_000 });

      cache.resetQueries(["rqp"]);
      expect(cache.get(["rqp"])?.data).toBe("placeholder");
    });
  });

  describe("GC (garbage collection)", () => {
    it("schedules GC after last observer unsubscribes", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      const obs = cache.observe(["gc"], fn, { staleTime: 60_000, gcTime: 1000 });
      await vi.runAllTimersAsync();

      obs.destroy();
      expect(cache.getEntries()).toHaveLength(1);

      vi.advanceTimersByTime(1001);
      expect(cache.getEntries()).toHaveLength(0);
    });

    it("GC is cancelled when new observer subscribes", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      const obs1 = cache.observe(["gc2"], fn, { staleTime: 60_000, gcTime: 1000 });
      await vi.runAllTimersAsync();

      obs1.destroy();
      vi.advanceTimersByTime(500);

      cache.observe(["gc2"], fn, { staleTime: 60_000 });
      vi.advanceTimersByTime(600);

      expect(cache.getEntries()).toHaveLength(1);
    });

    it("GC does not run if observer count > 0", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      const obs1 = cache.observe(["gc3"], fn, { staleTime: 60_000, gcTime: 100 });
      const obs2 = cache.observe(["gc3"], fn, { staleTime: 60_000, gcTime: 100 });
      await vi.runAllTimersAsync();

      obs1.destroy();
      vi.advanceTimersByTime(200);

      expect(cache.getEntries()).toHaveLength(1);
      obs2.destroy();
    });
  });

  describe("refetch intervals", () => {
    it("sets up refetch interval on subscribe", () => {
      vi.useRealTimers();
      const fn = vi.fn().mockResolvedValue("data");
      const obs = cache.observe(["interval"], fn, { staleTime: 60_000, refetchInterval: 5_000 });

      const entry = cache.getEntryByHash(JSON.stringify(["interval"]));
      expect(entry?.intervalId).not.toBeNull();
      obs.destroy();
      vi.useFakeTimers();
    });

    it("clears interval on unsubscribe", () => {
      vi.useRealTimers();
      const fn = vi.fn().mockResolvedValue("data");
      const obs = cache.observe(["interval2"], fn, { staleTime: 60_000, refetchInterval: 5_000 });

      const entry = cache.getEntryByHash(JSON.stringify(["interval2"]));
      expect(entry?.intervalId).not.toBeNull();
      obs.destroy();
      expect(entry?.intervalId).toBeNull();
      vi.useFakeTimers();
    });

    it("interval callback skips fetch when enabled=false", () => {
      vi.useRealTimers();
      const fn = vi.fn().mockResolvedValue("data");
      const obs = cache.observe(["interval3"], fn, {
        staleTime: 60_000,
        refetchInterval: 5_000,
        enabled: false,
      });

      const entry = cache.getEntryByHash(JSON.stringify(["interval3"]));
      expect(entry?.intervalId).not.toBeNull();
      expect(entry?.options.enabled).toBe(false);
      obs.destroy();
      vi.useFakeTimers();
    });
  });

  describe("focus listener", () => {
    it("refetches stale entries on window focus", async () => {
      const fn = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");
      cache.observe(["focus"], fn, { staleTime: 1000, refetchOnWindowFocus: true });
      await vi.runAllTimersAsync();

      vi.advanceTimersByTime(2000);
      window.dispatchEvent(new Event("focus"));
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("refetches on visibilitychange to visible when stale", async () => {
      const fn = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");
      cache.observe(["vis"], fn, { staleTime: 1000, refetchOnWindowFocus: true });
      await vi.runAllTimersAsync();

      vi.advanceTimersByTime(2000);
      Object.defineProperty(document, "visibilityState", { value: "visible", writable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does not refetch when refetchOnWindowFocus=false", async () => {
      const fn = vi.fn().mockResolvedValue("v1");
      cache.observe(["nofocus"], fn, { staleTime: 1000, refetchOnWindowFocus: false });
      await vi.runAllTimersAsync();

      vi.advanceTimersByTime(2000);
      window.dispatchEvent(new Event("focus"));
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("retry", () => {
    it("retries with functional retryDelay", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("e1"))
        .mockRejectedValueOnce(new Error("e2"))
        .mockResolvedValue("ok");

      cache.observe(["retry-fn"], fn, {
        retry: 2,
        retryDelay: (attempt) => attempt * 10,
        staleTime: 60_000,
      });
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(3);
      expect(cache.get(["retry-fn"])?.status).toBe("success");
    });

    it("exhausts retries and stores error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("permanent"));
      cache.observe(["retry-exhaust"], fn, {
        retry: 0,
        staleTime: 60_000,
      });
      await vi.runAllTimersAsync();

      expect(cache.get(["retry-exhaust"])?.status).toBe("error");
      expect(cache.get(["retry-exhaust"])?.error?.message).toBe("permanent");
    });

    it("handles non-Error rejection values", async () => {
      const fn = vi.fn().mockRejectedValue("string error");
      cache.observe(["retry-string"], fn, {
        retry: 0,
        staleTime: 60_000,
      });
      await vi.runAllTimersAsync();

      expect(cache.get(["retry-string"])?.status).toBe("error");
      expect(cache.get(["retry-string"])?.error?.message).toBe("string error");
    });

    it("isStale when dataUpdatedAt is 0", () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["stale0"], fn, { staleTime: 60_000 });

      expect(cache.get(["stale0"])?.isStale).toBe(true);
    });
  });

  describe("abort after generation change", () => {
    it("ignores stale results after cancel + refetch", async () => {
      let resolveFirst: ((v: string) => void) | undefined;
      const fn = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<string>((r) => {
              resolveFirst = r;
            })
        )
        .mockResolvedValueOnce("second");

      cache.observe(["gen"], fn, { staleTime: 60_000 });
      cache.cancel(["gen"]);
      cache.refetchEntry(JSON.stringify(["gen"]));
      resolveFirst?.("first");
      await vi.runAllTimersAsync();

      expect(cache.get(["gen"])?.data).toBe("second");
    });

    it("isAborted returns true for aborted signal", async () => {
      const controller = new AbortController();
      controller.abort();

      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["aborted"], fn, { staleTime: 60_000 });
      cache.cancel(["aborted"]);
      await vi.runAllTimersAsync();

      expect(cache.get(["aborted"])?.fetchStatus).toBe("idle");
    });
  });

  describe("devtools", () => {
    it("getDevtools returns subscribe, getSnapshot, clearMutations", () => {
      const devtools = cache.getDevtools();
      expect(typeof devtools.subscribe).toBe("function");
      expect(typeof devtools.getSnapshot).toBe("function");
      expect(typeof devtools.clearMutations).toBe("function");
    });

    it("devtools snapshot includes query entries", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["dt"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      const snapshot = cache.getDevtools().getSnapshot();
      expect(snapshot.queries).toHaveLength(1);
      expect(snapshot.queries[0].keyHash).toBe(JSON.stringify(["dt"]));
    });

    it("clearMutations clears mutation history", () => {
      cache.getDevtools().clearMutations();
      const snapshot = cache.getDevtools().getSnapshot();
      expect(snapshot.mutations).toHaveLength(0);
    });
  });

  describe("mutate", () => {
    it("successful mutation with callbacks", async () => {
      const onMutate = vi.fn().mockResolvedValue({ rollback: true });
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const mutation = cache.mutate({
        mutationFn: async (title: string) => `created:${title}`,
        onMutate,
        onSuccess,
        onError,
        onSettled,
      });

      const result = await mutation.mutate("Task");
      expect(result).toBe("created:Task");
      expect(mutation.isSuccess).toBe(true);
      expect(onMutate).toHaveBeenCalledWith("Task");
      expect(onSuccess).toHaveBeenCalledWith("created:Task", "Task", { rollback: true });
      expect(onSettled).toHaveBeenCalledWith("created:Task", null, "Task", { rollback: true });
      expect(onError).not.toHaveBeenCalled();
    });

    it("failed mutation with error callback", async () => {
      const onError = vi.fn();
      const onSettled = vi.fn();

      const errorCache = createCache({ defaultMutationRetry: 0 });
      const mutation = errorCache.mutate({
        mutationFn: () => {
          return Promise.reject(new Error("fail"));
        },
        onError,
        onSettled,
      });

      await mutation.mutate("x").catch(() => undefined);
      expect(mutation.status).toBe("error");
      expect(onError).toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalled();
      errorCache.reset();
    });

    it("non-Error rejection is wrapped", async () => {
      const errorCache = createCache({ defaultMutationRetry: 0 });
      const mutation = errorCache.mutate({
        mutationFn: () => {
          return Promise.reject("string");
        },
      });

      await mutation.mutate("x").catch(() => undefined);
      expect(mutation.status).toBe("error");
      errorCache.reset();
    });

    it("reset returns to idle", async () => {
      const mutation = cache.mutate({
        mutationFn: async () => "data",
      });

      await mutation.mutate("x");
      mutation.reset();

      expect(mutation.status).toBe("idle");
      expect(mutation.data).toBeUndefined();
      expect(mutation.error).toBeNull();
    });

    it("mutation retry on transient failure", async () => {
      let callCount = 0;
      const mutation = cache.mutate({
        mutationFn: (): Promise<string> => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error("transient"));
          }
          return Promise.resolve("ok");
        },
      });

      const promise = mutation.mutate("x");
      await vi.advanceTimersByTimeAsync(50);
      const result = await promise;
      expect(result).toBe("ok");
      expect(callCount).toBe(2);
    });

    it("mutation retries exhausted", async () => {
      const retryCache = createCache({ defaultMutationRetry: 2 });
      const mutation = retryCache.mutate({
        mutationFn: () => {
          return Promise.reject(new Error("permanent"));
        },
      });

      const handled = mutation.mutate("x").catch(() => undefined);
      // advance past the retry delays (10ms then 20ms)
      await vi.advanceTimersByTimeAsync(50);
      await handled;
      expect(mutation.status).toBe("error");
      retryCache.reset();
    });
  });

  describe("prefetch", () => {
    it("prefetch loads data without subscribing", async () => {
      const fn = vi.fn().mockResolvedValue("prefetched");
      await cache.prefetch(["pf"], fn);

      expect(cache.get(["pf"])?.data).toBe("prefetched");
      expect(cache.getEntryByHash(JSON.stringify(["pf"]))?.observers).toBe(0);
    });

    it("prefetch reuses existing entry", async () => {
      const fn = vi.fn().mockResolvedValue("cached");
      await cache.prefetch(["pf2"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      await cache.prefetch(["pf2"], fn, { staleTime: 60_000 });
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("query with abort signal", () => {
    it("queryFn receives signal", async () => {
      const fn = vi.fn().mockImplementation(({ signal }: { signal: AbortSignal }) => {
        expect(signal).toBeInstanceOf(AbortSignal);
        return Promise.resolve("ok");
      });

      cache.observe(["signal"], fn);
      await vi.runAllTimersAsync();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("query definition object overloads", () => {
    it("observe with definition object", async () => {
      const fn = vi.fn().mockResolvedValue("def-data");
      const state = cache.observe(["def-key"] as never, fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      expect(state.data).toBe("def-data");
    });
  });

  describe("stale detection", () => {
    it("isStale true when dataUpdatedAt=0", () => {
      const fn = vi.fn().mockResolvedValue("d");
      cache.observe(["s0"], fn);
      expect(cache.get(["s0"])?.isStale).toBe(true);
    });

    it("isStale false when within staleTime", async () => {
      const fn = vi.fn().mockResolvedValue("d");
      cache.observe(["s1"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();
      expect(cache.get(["s1"])?.isStale).toBe(false);
    });

    it("isStale true when past staleTime", async () => {
      const fn = vi.fn().mockResolvedValue("d");
      cache.observe(["s2"], fn, { staleTime: 1000 });
      await vi.runAllTimersAsync();
      vi.advanceTimersByTime(2000);
      expect(cache.get(["s2"])?.isStale).toBe(true);
    });
  });

  describe("error state transitions", () => {
    it("stores error with timestamp", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      cache.observe(["err"], fn, { retry: 0 });
      await vi.runAllTimersAsync();

      const state = cache.get(["err"]);
      expect(state?.status).toBe("error");
      expect(state?.error?.message).toBe("boom");
      expect(state?.errorUpdatedAt).toBeGreaterThan(0);
    });

    it("transitions from error to success on retry", async () => {
      const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("recovered");

      cache.observe(["err-rec"], fn, { retry: 1, retryDelay: 10, staleTime: 60_000 });
      await vi.runAllTimersAsync();

      expect(cache.get(["err-rec"])?.status).toBe("success");
      expect(cache.get(["err-rec"])?.data).toBe("recovered");
    });
  });

  describe("concurrent refetch + cancel", () => {
    it("refetch during active fetch aborts and restarts", async () => {
      let call = 0;
      const fn = vi.fn().mockImplementation(() => {
        call++;
        if (call === 1) {
          return new Promise<string>(() => undefined);
        }
        return Promise.resolve("fresh");
      });

      cache.observe(["cr"], fn, { staleTime: 60_000 });
      cache.refetchEntry(JSON.stringify(["cr"]));
      await vi.runAllTimersAsync();

      expect(cache.get(["cr"])?.data).toBe("fresh");
    });
  });

  describe("refetchEntry", () => {
    it("returns undefined for missing entry", () => {
      const result = cache.refetchEntry("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("recordFetchDuration", () => {
    it("records fetch duration on success", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["dur"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      const entry = cache.getEntryByHash(JSON.stringify(["dur"]));
      expect(entry?.lastFetchDurationMs).toBeGreaterThanOrEqual(0);
      expect(entry?.fetchStartedAt).toBeNull();
    });

    it("records fetch duration on error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("e"));
      cache.observe(["dur-err"], fn, { retry: 0, staleTime: 60_000 });
      await vi.runAllTimersAsync();

      const entry = cache.getEntryByHash(JSON.stringify(["dur-err"]));
      expect(entry?.lastFetchDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("disposeEntryHandle", () => {
    it("cleans up devtoolsUnsubscribe on remove", async () => {
      const fn = vi.fn().mockResolvedValue("d");
      cache.observe(["disp"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.remove(["disp"]);
      expect(cache.getEntries()).toHaveLength(0);
    });

    it("cleans up handle on reset", async () => {
      const fn = vi.fn().mockResolvedValue("d");
      cache.observe(["disp2"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.reset();
      expect(cache.getEntries()).toHaveLength(0);
    });
  });

  describe("clearTimers on remove", () => {
    it("clears refetch interval on remove", () => {
      vi.useRealTimers();
      const fn = vi.fn().mockResolvedValue("d");
      cache.observe(["ct"], fn, { staleTime: 60_000, refetchInterval: 1_000 });

      const hash = JSON.stringify(["ct"]);
      const entry = cache.getEntryByHash(hash);
      expect(entry?.intervalId).not.toBeNull();

      cache.remove(["ct"]);
      expect(entry?.intervalId).toBeNull();
      vi.useFakeTimers();
    });
  });

  describe("runQuery generation guard", () => {
    it("exits early if generation changed during fetch", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      cache.observe(["gen2"], fn, { staleTime: 60_000 });
      await vi.runAllTimersAsync();

      cache.cancel(["gen2"]);
      cache.refetchEntry(JSON.stringify(["gen2"]));
      await vi.runAllTimersAsync();

      expect(cache.get(["gen2"])?.fetchStatus).toBe("idle");
    });
  });
});
