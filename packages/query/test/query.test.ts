import query, { createQueryClient } from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import type { QueryStore } from "../src/types.js";

type Todo = { id: number; title: string };

describe("@ailuracode/alpine-query", () => {
  let store: QueryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    const Alpine = startAlpine(query({ adapter: createAlpineStoreAdapter }));
    store = Alpine.store("query") as QueryStore;
  });

  afterEach(() => {
    store.reset();
    vi.useRealTimers();
  });

  it("registers $store.query via query({ adapter })", () => {
    expect(store).toBeDefined();
    expect(typeof store.observe).toBe("function");
    expect(typeof store.mutate).toBe("function");
  });

  it("createQueryClient uses vanilla adapter by default", () => {
    const client = createQueryClient();
    expect(client.observe).toBeTypeOf("function");
    client.reset();
  });

  it("observe() fetches data and exposes TanStack-like state", async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 1, title: "Learn Alpine" }]);
    const query = store.observe<Todo[]>(["todos"], queryFn);

    expect(query.isLoading).toBe(true);
    expect(query.isPending).toBe(true);

    await vi.runAllTimersAsync();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(query.isSuccess).toBe(true);
    expect(query.data).toEqual([{ id: 1, title: "Learn Alpine" }]);
    expect(query.isLoading).toBe(false);
    expect(query.isFetching).toBe(false);

    query.destroy();
  });

  it("reuses cached data within staleTime", async () => {
    const queryFn = vi.fn().mockResolvedValue("cached");

    const first = store.observe(["profile"], queryFn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();
    first.destroy();

    const second = store.observe(["profile"], queryFn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(second.data).toBe("cached");
    second.destroy();
  });

  it("refetches stale data", async () => {
    const queryFn = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");

    const query = store.observe(["posts"], queryFn, { staleTime: 1_000 });
    await vi.runAllTimersAsync();
    expect(query.data).toBe("first");

    vi.advanceTimersByTime(2_000);
    await query.refetch();
    await vi.runAllTimersAsync();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(query.data).toBe("second");
    query.destroy();
  });

  it("invalidate() triggers background refetch for active queries", async () => {
    const queryFn = vi.fn().mockResolvedValueOnce("v1").mockResolvedValueOnce("v2");

    const query = store.observe(["items"], queryFn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();
    expect(query.data).toBe("v1");

    store.invalidate(["items"]);
    await vi.runAllTimersAsync();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(query.data).toBe("v2");
    query.destroy();
  });

  it("setData() updates cache optimistically", async () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 1, title: "Todo" }]);
    const query = store.observe<Todo[]>(["todos"], queryFn);
    await vi.runAllTimersAsync();

    store.setData<Todo[]>(["todos"], (current) => [...(current ?? []), { id: 2, title: "New" }]);

    expect(query.data).toEqual([
      { id: 1, title: "Todo" },
      { id: 2, title: "New" },
    ]);
    query.destroy();
  });

  it("retries failed queries", async () => {
    const queryFn = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce("ok");

    const query = store.observe(["retry"], queryFn, { retry: 1, retryDelay: 10 });
    await vi.runAllTimersAsync();

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(query.isSuccess).toBe(true);
    expect(query.data).toBe("ok");
    query.destroy();
  });

  it("respects enabled: false", async () => {
    const queryFn = vi.fn().mockResolvedValue("hidden");

    const query = store.observe(["disabled"], queryFn, { enabled: false });
    await vi.runAllTimersAsync();

    expect(queryFn).not.toHaveBeenCalled();
    expect(query.fetchStatus).toBe("paused");
    query.destroy();
  });

  it("mutate() runs mutation lifecycle callbacks", async () => {
    const onMutate = vi.fn().mockResolvedValue({ rollback: true });
    const onSuccess = vi.fn();
    const onSettled = vi.fn();

    const mutation = store.mutate<string, { title: string }, { rollback: boolean }>({
      mutationFn: async ({ title }) => `created:${title}`,
      onMutate,
      onSuccess,
      onSettled,
    });

    const result = await mutation.mutate({ title: "Task" });

    expect(result).toBe("created:Task");
    expect(mutation.isSuccess).toBe(true);
    expect(onMutate).toHaveBeenCalledWith({ title: "Task" });
    expect(onSuccess).toHaveBeenCalledWith("created:Task", { title: "Task" }, { rollback: true });
    expect(onSettled).toHaveBeenCalledWith(
      "created:Task",
      null,
      { title: "Task" },
      { rollback: true }
    );
  });

  it("remove() clears matching queries", async () => {
    const queryFn = vi.fn().mockResolvedValue("gone");
    const query = store.observe(["temp"], queryFn);
    await vi.runAllTimersAsync();

    store.remove(["temp"]);

    expect(store.get(["temp"])).toBeUndefined();
    expect(query.data).toBe("gone");
  });

  it("prefetch() loads data without subscribing", async () => {
    const queryFn = vi.fn().mockResolvedValue("prefetched");

    await store.prefetch(["prefetch"], queryFn);
    await vi.runAllTimersAsync();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(store.get(["prefetch"])?.data).toBe("prefetched");
  });

  it("fetch() returns query state without subscribing", async () => {
    const queryFn = vi.fn().mockResolvedValue("fetched");
    const query = store.fetch(["fetch-only"], queryFn);
    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toBe("fetched");
  });

  it("cancel() stops an in-flight query", () => {
    const queryFn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("late"), 5_000);
        })
    );

    const query = store.observe(["cancel-me"], queryFn);
    expect(query.isFetching).toBe(true);
    store.cancel(["cancel-me"]);
    expect(query.fetchStatus).toBe("idle");
    query.destroy();
  });

  it("invalidate() without a key refetches all active queries", async () => {
    const first = vi.fn().mockResolvedValueOnce("a1").mockResolvedValueOnce("a2");
    const second = vi.fn().mockResolvedValueOnce("b1").mockResolvedValueOnce("b2");

    const q1 = store.observe(["a"], first, { staleTime: 60_000 });
    const q2 = store.observe(["b"], second, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    store.invalidate();
    await vi.runAllTimersAsync();

    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    q1.destroy();
    q2.destroy();
  });

  it("supports initialData and partial invalidation", async () => {
    const queryFn = vi.fn().mockResolvedValue("live");

    const query = store.observe(["items", 1], queryFn, { initialData: "seed", staleTime: 60_000 });
    expect(query.data).toBe("seed");

    const sibling = store.observe(["items", 2], queryFn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();

    store.invalidate(["items"]);
    await vi.runAllTimersAsync();

    expect(queryFn.mock.calls.length).toBeGreaterThanOrEqual(2);
    query.destroy();
    sibling.destroy();
  });

  it("mutation onError receives context from onMutate", async () => {
    const onError = vi.fn();
    const mutation = store.mutate<string, string, { saved: boolean }>({
      mutationFn: () => {
        throw new Error("fail");
      },
      onMutate: async () => ({ saved: true }),
      onError,
    });

    await expect(mutation.mutate("x")).rejects.toThrow("fail");
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "x", { saved: true });
  });
});
