import { describe, expect, it } from "vitest";
import type {
  MutationDevtoolsEntryView,
  QueryDevtoolsEntryView,
} from "../src/devtools/merge-stores.js";
import {
  mutationSortLabel,
  pickLatestMutation,
  pickLatestQuery,
  querySortLabel,
  querySortTimestamp,
  sortMutations,
  sortQueries,
} from "../src/devtools/sort.js";

function entry(
  key: readonly unknown[],
  patch: Partial<QueryDevtoolsEntryView> = {}
): QueryDevtoolsEntryView {
  return {
    key,
    keyHash: JSON.stringify(key),
    status: "success",
    fetchStatus: "idle",
    observers: 1,
    isStale: false,
    isLoading: false,
    isFetching: false,
    isError: false,
    isSuccess: true,
    isInvalidated: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    fetchStartedAt: null,
    fetchDurationMs: null,
    data: null,
    error: null,
    options: {
      enabled: true,
      staleTime: 0,
      gcTime: 300_000,
      refetchOnWindowFocus: true,
      refetchInterval: false,
      retry: 0,
      retryDelay: 0,
    },
    adapterName: "Nanostores",
    storeId: "0",
    entryId: `0::${JSON.stringify(key)}`,
    ...patch,
  };
}

describe("query devtools sort", () => {
  it("sorts queries by key ascending", () => {
    const sorted = sortQueries([entry(["z"]), entry(["a"]), entry(["m"])], "key-asc");

    expect(sorted.map((item) => item.key[0])).toEqual(["a", "m", "z"]);
  });

  it("sorts queries by last updated descending by default", () => {
    const sorted = sortQueries(
      [entry(["old"], { dataUpdatedAt: 10 }), entry(["new"], { dataUpdatedAt: 100 })],
      "updated-desc"
    );

    expect(sorted.map((item) => item.key[0])).toEqual(["new", "old"]);
  });

  it("sorts in-flight queries to the top when sorting by last updated", () => {
    const sorted = sortQueries(
      [
        entry(["cached"], { dataUpdatedAt: 100 }),
        entry(["loading"], {
          status: "pending",
          fetchStatus: "fetching",
          isSuccess: false,
          isFetching: true,
          dataUpdatedAt: 0,
        }),
      ],
      "updated-desc"
    );

    expect(sorted.map((item) => item.key[0])).toEqual(["loading", "cached"]);
  });

  it("picks the most recently active query", () => {
    const latest = pickLatestQuery([
      entry(["stale"], { dataUpdatedAt: 10 }),
      entry(["active"], {
        status: "pending",
        fetchStatus: "fetching",
        isSuccess: false,
        isFetching: true,
      }),
      entry(["recent"], { dataUpdatedAt: 50 }),
    ]);

    expect(latest?.key).toEqual(["active"]);
  });

  it("prefers a newer in-flight query over an older success", () => {
    const latest = pickLatestQuery([
      entry(["done"], { dataUpdatedAt: 100 }),
      entry(["loading"], {
        status: "pending",
        fetchStatus: "fetching",
        isSuccess: false,
        isFetching: true,
      }),
    ]);

    expect(latest?.key).toEqual(["loading"]);
  });

  it("pickLatestQuery returns undefined for empty array", () => {
    expect(pickLatestQuery([])).toBeUndefined();
  });

  it("querySortTimestamp returns errorUpdatedAt when larger", () => {
    const e = entry(["e"], { dataUpdatedAt: 10, errorUpdatedAt: 50 });
    expect(querySortTimestamp(e)).toBe(50);
  });

  it("querySortTimestamp returns MAX_SAFE_INTEGER for active query with no timestamps", () => {
    const e = entry(["e"], {
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      isFetching: true,
      isSuccess: false,
    });
    expect(querySortTimestamp(e)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("querySortTimestamp returns 0 for idle query with no timestamps", () => {
    expect(querySortTimestamp(entry(["e"]))).toBe(0);
  });

  it("sorts queries by updated-asc", () => {
    const sorted = sortQueries(
      [entry(["new"], { dataUpdatedAt: 100 }), entry(["old"], { dataUpdatedAt: 10 })],
      "updated-asc"
    );
    expect(sorted.map((item) => item.key[0])).toEqual(["old", "new"]);
  });

  it("sorts queries by status", () => {
    const sorted = sortQueries(
      [
        entry(["success"], { status: "success" }),
        entry(["error"], { status: "error", isError: true, isSuccess: false }),
        entry(["pending"], { status: "pending", isSuccess: false }),
      ],
      "status"
    );
    expect(sorted.map((item) => item.key[0])).toEqual(["pending", "error", "success"]);
  });

  it("sorts queries by status with tiebreaker on key", () => {
    const sorted = sortQueries(
      [entry(["z"], { status: "success" }), entry(["a"], { status: "success" })],
      "status"
    );
    expect(sorted.map((item) => item.key[0])).toEqual(["a", "z"]);
  });

  it("querySortLabel returns correct labels", () => {
    expect(querySortLabel("updated-desc")).toBe("Last updated");
    expect(querySortLabel("updated-asc")).toBe("Oldest first");
    expect(querySortLabel("key-asc")).toBe("Query key");
    expect(querySortLabel("status")).toBe("Status");
  });

  it("mutationSortLabel returns correct labels", () => {
    expect(mutationSortLabel("updated-desc")).toBe("Last updated");
    expect(mutationSortLabel("updated-asc")).toBe("Oldest first");
    expect(mutationSortLabel("status")).toBe("Status");
  });

  it("pickLatestMutation returns undefined for empty array", () => {
    expect(pickLatestMutation([])).toBeUndefined();
  });

  it("pickLatestMutation picks the most recent", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 50, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "3", entryId: "3", updatedAt: 30, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    expect(pickLatestMutation(mutations)?.id).toBe("2");
  });

  it("sortMutations sorts by updated-desc by default", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 50, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    const sorted = sortMutations(mutations, "updated-desc");
    expect(sorted.map((m) => m.id)).toEqual(["2", "1"]);
  });

  it("sortMutations sorts by updated-asc", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 50, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    const sorted = sortMutations(mutations, "updated-asc");
    expect(sorted.map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("sortMutations sorts by status", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 50, status: "pending", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    const sorted = sortMutations(mutations, "status");
    expect(sorted.map((m) => m.id)).toEqual(["2", "1"]);
  });

  it("sortMutations uses updatedAt as tiebreaker for status sort", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 50, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    const sorted = sortMutations(mutations, "status");
    expect(sorted.map((m) => m.id)).toEqual(["2", "1"]);
  });

  it("sortMutations uses entryId as tiebreaker for updated-desc", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    const sorted = sortMutations(mutations, "updated-desc");
    expect(sorted.map((m) => m.id)).toEqual(["2", "1"]);
  });

  it("sortMutations uses entryId as tiebreaker for updated-asc", () => {
    const mutations: MutationDevtoolsEntryView[] = [
      { id: "1", entryId: "1", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
      { id: "2", entryId: "2", updatedAt: 10, status: "success", storeId: "0", adapterName: "X", variables: undefined, data: undefined, error: null },
    ];
    const sorted = sortMutations(mutations, "updated-asc");
    expect(sorted.map((m) => m.id)).toEqual(["1", "2"]);
  });
});
