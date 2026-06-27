import { createQueryClient } from "@ailuracode/alpinejs-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpinejs-query-adapter-alpine";
import { nanostoresQueryAdapter } from "@ailuracode/alpinejs-query-adapter-nanostores";
import { createAlpineZustandAdapter } from "@ailuracode/alpinejs-query-adapter-zustand";
import { describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { createMergedQueryDevtools } from "../src/merge-stores.js";

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
});
