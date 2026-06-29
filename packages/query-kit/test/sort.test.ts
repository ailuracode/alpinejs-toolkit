import { describe, expect, it } from "vitest";
import type { QueryDevtoolsEntryView } from "../src/devtools/merge-stores.js";
import { pickLatestQuery, sortQueries } from "../src/devtools/sort.js";

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
});
