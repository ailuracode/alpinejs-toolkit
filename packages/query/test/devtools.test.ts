import query from "@ailuracode/alpinejs-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpinejs-query-adapter-alpine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import type { QueryStore } from "../src/index.js";

describe("@ailuracode/alpinejs-query devtools", () => {
  let store: QueryStore;

  beforeEach(() => {
    const Alpine = startAlpine(query({ adapter: createAlpineStoreAdapter }));
    store = Alpine.store("query") as QueryStore;
  });

  afterEach(() => {
    store.reset();
  });

  it("reports pending and fetching states before a query resolves", async () => {
    vi.useFakeTimers();

    let resolve!: (value: string) => void;
    const pending = new Promise<string>((done) => {
      resolve = done;
    });

    const queryObserver = store.observe(["slow"], async () => pending);

    expect(store.devtools.getSnapshot().queries[0]?.status).toBe("pending");
    expect(store.devtools.getSnapshot().queries[0]?.fetchStatus).toBe("fetching");
    expect(store.devtools.getSnapshot().queries[0]?.fetchDurationMs).toBe(0);

    vi.advanceTimersByTime(250);
    expect(store.devtools.getSnapshot().queries[0]?.fetchDurationMs).toBe(250);

    resolve("ok");
    await vi.waitFor(() => {
      expect(queryObserver.isSuccess).toBe(true);
    });

    expect(store.devtools.getSnapshot().queries[0]?.status).toBe("success");
    expect(store.devtools.getSnapshot().queries[0]?.fetchDurationMs).toBeGreaterThanOrEqual(250);
    expect(store.devtools.getSnapshot().queries[0]?.fetchStartedAt).toBeNull();
    queryObserver.destroy();
    vi.useRealTimers();
  });

  it("notifies devtools subscribers on intermediate query states", async () => {
    const listener = vi.fn();
    store.devtools.subscribe(listener);

    let resolve!: (value: string) => void;
    const pending = new Promise<string>((done) => {
      resolve = done;
    });

    const queryObserver = store.observe(["notify-me"], async () => pending);
    expect(listener).toHaveBeenCalled();
    expect(store.devtools.getSnapshot().queries[0]?.fetchStatus).toBe("fetching");

    resolve("ok");
    await vi.waitFor(() => {
      expect(queryObserver.isSuccess).toBe(true);
    });

    expect(store.devtools.getSnapshot().queries[0]?.status).toBe("success");
    expect(listener.mock.calls.length).toBeGreaterThan(1);
    queryObserver.destroy();
  });

  it("exposes devtools snapshot and subscription", async () => {
    const listener = vi.fn();
    const unsubscribe = store.devtools.subscribe(listener);

    const query = store.observe(["devtools"], async () => "ok");
    await vi.waitFor(() => {
      expect(query.isSuccess).toBe(true);
    });

    const snapshot = store.devtools.getSnapshot();
    expect(snapshot.adapterName).toBe("Alpine.reactive");
    expect(snapshot.queries).toHaveLength(1);
    expect(snapshot.queries[0]?.key).toEqual(["devtools"]);
    expect(snapshot.queries[0]?.data).toBe("ok");
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    query.destroy();
  });

  it("tracks mutation history", async () => {
    const mutation = store.mutate<string, string>({
      mutationFn: async (value) => `done:${value}`,
    });

    await mutation.mutate("test");

    const snapshot = store.devtools.getSnapshot();
    expect(snapshot.mutations[0]?.status).toBe("success");
    expect(snapshot.mutations[0]?.variables).toBe("test");
    expect(snapshot.mutations[0]?.data).toBe("done:test");
  });

  it("tracks failed mutations and clears history on reset", async () => {
    const mutation = store.mutate<never, string>({
      mutationFn: () => {
        throw new Error("mutation failed");
      },
    });

    await expect(mutation.mutate("x")).rejects.toThrow("mutation failed");

    expect(store.devtools.getSnapshot().mutations[0]?.status).toBe("error");
    store.reset();
    expect(store.devtools.getSnapshot().mutations).toHaveLength(0);
  });

  it("clears mutations without removing cached queries", async () => {
    const query = store.observe(["keep"], async () => "cached");
    await vi.waitFor(() => {
      expect(query.isSuccess).toBe(true);
    });

    const mutation = store.mutate<string, string>({
      mutationFn: async (value) => value,
    });
    await mutation.mutate("x");

    expect(store.devtools.getSnapshot().mutations).toHaveLength(1);
    store.clearMutations();
    expect(store.devtools.getSnapshot().mutations).toHaveLength(0);
    expect(store.get(["keep"])?.data).toBe("cached");

    query.destroy();
  });

  it("resetQueries() restores a query to its initial state", () => {
    const query = store.observe(["reset-me"], async () => "loaded", {
      initialData: "seed",
      staleTime: 60_000,
    });

    store.resetQueries(["reset-me"]);
    expect(query.data).toBe("seed");
    expect(query.status).toBe("success");

    query.destroy();
  });
});
