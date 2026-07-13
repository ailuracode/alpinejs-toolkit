import { createQueryClient } from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import { createAlpineZustandAdapter } from "@ailuracode/alpine-query-adapter-zustand";
import { describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { createMergedQueryDevtools } from "../src/devtools/merge-stores.js";
import { nanostoresQueryAdapter } from "../src/nanostores/adapter.js";

describe("query devtools merge stores", () => {
  it("merges snapshots from multiple query clients", async () => {
    const Alpine = startAlpine();
    const alpineClient = createQueryClient({ adapter: createAlpineStoreAdapter(Alpine) });
    const zustandClient = createQueryClient({ adapter: createAlpineZustandAdapter(Alpine) });
    const merged = createMergedQueryDevtools([alpineClient, zustandClient]);

    const alpineQuery = alpineClient.observe(["alpha"], async () => "a");
    const zustandQuery = zustandClient.observe(["beta"], async () => "b");

    await vi.waitFor(() => {
      expect(alpineQuery.isSuccess).toBe(true);
      expect(zustandQuery.isSuccess).toBe(true);
    });

    const snapshot = merged.getSnapshotView();
    expect(snapshot.adapterName).toBe("Alpine.reactive · Zustand");
    expect(snapshot.queries).toHaveLength(2);
    expect(snapshot.queries.map((entry) => entry.adapterName).sort()).toEqual([
      "Alpine.reactive",
      "Zustand",
    ]);

    const alpineEntry = snapshot.queries.find((entry) => entry.adapterName === "Alpine.reactive");
    if (!alpineEntry) {
      throw new Error("Expected Alpine.reactive query entry");
    }

    merged.getStoreForQuery(alpineEntry).remove(alpineEntry.key);
    expect(alpineClient.get(["alpha"])).toBeUndefined();
    expect(zustandClient.get(["beta"])).toBeDefined();

    alpineQuery.destroy();
    zustandQuery.destroy();
    alpineClient.reset();
    zustandClient.reset();
  });

  it("notifies listeners when any store changes", async () => {
    const Alpine = startAlpine();
    const alpineClient = createQueryClient({ adapter: createAlpineStoreAdapter(Alpine) });
    const zustandClient = createQueryClient({ adapter: createAlpineZustandAdapter(Alpine) });
    const merged = createMergedQueryDevtools([alpineClient, zustandClient]);
    const listener = vi.fn();

    merged.devtools.subscribe(listener);
    const query = zustandClient.observe(["listener"], async () => "ok");

    await vi.waitFor(() => {
      expect(query.isSuccess).toBe(true);
    });

    expect(listener).toHaveBeenCalled();
    query.destroy();
    zustandClient.reset();
    alpineClient.reset();
  });

  it("routes actions to the correct store when adapter names repeat", async () => {
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const secondary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const merged = createMergedQueryDevtools([primary, secondary]);

    primary.observe(["shared", "primary"], async () => "primary");
    secondary.observe(["shared", "secondary"], async () => "secondary");

    await vi.waitFor(() => {
      expect(primary.get(["shared", "primary"])?.isSuccess).toBe(true);
      expect(secondary.get(["shared", "secondary"])?.isSuccess).toBe(true);
    });

    const snapshot = merged.getSnapshotView();
    expect(snapshot.adapterName).toBe("Nanostores #1 · Nanostores #2");

    const secondaryEntry = snapshot.queries.find((entry) => entry.adapterName === "Nanostores #2");
    if (!secondaryEntry) {
      throw new Error("Expected Nanostores #2 query entry");
    }

    merged.getStoreForQuery(secondaryEntry).remove(secondaryEntry.key);
    expect(primary.get(["shared", "primary"])?.data).toBe("primary");
    expect(secondary.get(["shared", "secondary"])).toBeUndefined();

    primary.reset();
    secondary.reset();
  });

  it("exposes adapter options for each merged store", () => {
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const secondary = createQueryClient({ adapter: createAlpineStoreAdapter(startAlpine()) });
    const merged = createMergedQueryDevtools([primary, secondary]);

    expect(merged.getAdapterOptions()).toEqual([
      { id: "0", label: "Nanostores" },
      { id: "1", label: "Alpine.reactive" },
    ]);
  });

  it("throws when no stores have devtools support", () => {
    const fakeStore = { devtools: undefined } as unknown as Parameters<
      typeof createMergedQueryDevtools
    >[0][number];
    expect(() => createMergedQueryDevtools([fakeStore])).toThrow(
      /requires at least one query store/
    );
  });

  it("throws when a store lacks devtools", () => {
    const valid = createQueryClient({ adapter: nanostoresQueryAdapter });
    const fakeStore = { devtools: undefined } as unknown as Parameters<
      typeof createMergedQueryDevtools
    >[0][number];
    // Only the invalid store is passed, so validStores is empty
    expect(() => createMergedQueryDevtools([fakeStore])).toThrow(
      /requires at least one query store/
    );
    valid.reset();
  });

  it("getStoresForScope returns all stores for 'all' scope", () => {
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const secondary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const merged = createMergedQueryDevtools([primary, secondary]);

    expect(merged.getStoresForScope("all")).toHaveLength(2);
  });

  it("getStoresForScope returns empty array for unknown scope", () => {
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const merged = createMergedQueryDevtools([primary]);

    expect(merged.getStoresForScope("unknown")).toEqual([]);
  });

  it("getStoreForQuery throws for unknown storeId", () => {
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const merged = createMergedQueryDevtools([primary]);

    expect(() =>
      merged.getStoreForQuery({ storeId: "unknown" } as unknown as Parameters<
        typeof merged.getStoreForQuery
      >[0])
    ).toThrow(/No query store registered/);
  });

  it("getStoreForMutation throws for unknown storeId", () => {
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const merged = createMergedQueryDevtools([primary]);

    expect(() =>
      merged.getStoreForMutation({ storeId: "unknown" } as unknown as Parameters<
        typeof merged.getStoreForMutation
      >[0])
    ).toThrow(/No query store registered/);
  });

  it("resolveQueryDevtoolsStores uses stores array when provided", async () => {
    const { resolveQueryDevtoolsStores } = await import("../src/devtools/merge-stores.js");
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const secondary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const stores = resolveQueryDevtoolsStores({ stores: [primary, secondary] });

    expect(stores).toContain(primary);
    expect(stores).toContain(secondary);
  });

  it("resolveQueryDevtoolsStores uses single store when provided", async () => {
    const { resolveQueryDevtoolsStores } = await import("../src/devtools/merge-stores.js");
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const stores = resolveQueryDevtoolsStores({ store: primary });

    expect(stores).toContain(primary);
  });

  it("resolveQueryDevtoolsStores combines store and additionalStores", async () => {
    const { resolveQueryDevtoolsStores } = await import("../src/devtools/merge-stores.js");
    const primary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const secondary = createQueryClient({ adapter: nanostoresQueryAdapter });
    const stores = resolveQueryDevtoolsStores({
      store: primary,
      additionalStores: [secondary],
    });

    expect(stores).toContain(primary);
    expect(stores).toContain(secondary);
  });

  it("resolveQueryDevtoolsStores throws when no stores provided", async () => {
    const { resolveQueryDevtoolsStores } = await import("../src/devtools/merge-stores.js");
    expect(() => resolveQueryDevtoolsStores({})).toThrow(/requires at least one query store/);
  });

  it("clearMutations clears all stores", async () => {
    const Alpine = startAlpine();
    const primary = createQueryClient({ adapter: createAlpineStoreAdapter(Alpine) });
    const secondary = createQueryClient({ adapter: createAlpineStoreAdapter(Alpine) });
    const merged = createMergedQueryDevtools([primary, secondary]);

    const mutation = primary.mutate<string, string>({ mutationFn: async (x) => `ok:${x}` });
    await mutation.mutate("x");
    const beforeSnapshot = primary.devtools.getSnapshot();
    expect(beforeSnapshot.mutations.length).toBeGreaterThan(0);

    merged.devtools.clearMutations();
    const afterPrimary = primary.devtools.getSnapshot();
    const afterSecondary = secondary.devtools.getSnapshot();
    expect(afterPrimary.mutations).toHaveLength(0);
    expect(afterSecondary.mutations).toHaveLength(0);

    primary.reset();
    secondary.reset();
  });
});
