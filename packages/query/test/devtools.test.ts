import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import queryPlugin, { type QueryStore } from "../src/index.js";

describe("@ailuracode/alpine-query devtools", () => {
  let store: QueryStore;

  beforeEach(() => {
    const Alpine = startAlpine(queryPlugin());
    store = Alpine.store("query") as QueryStore;
  });

  afterEach(() => {
    store.reset();
  });

  it("exposes devtools snapshot and subscription", async () => {
    const listener = vi.fn();
    const unsubscribe = store.devtools.subscribe(listener);

    const query = store.observe(["devtools"], async () => "ok");
    await vi.waitFor(() => {
      expect(query.isSuccess).toBe(true);
    });

    const snapshot = store.devtools.getSnapshot();
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
});
