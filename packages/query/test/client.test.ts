import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createQueryClient } from "../src/client.js";
import { queryOptions } from "../src/options.js";
import type { QueryFunction, QueryKey, QueryObserver, QueryStore } from "../src/types.js";

type Todo = { id: number; title: string };

describe("createQueryClient()", () => {
  let client: QueryStore;

  beforeEach(() => {
    vi.useFakeTimers();
    client = createQueryClient();
  });

  afterEach(() => {
    client.reset();
    vi.useRealTimers();
  });

  it("works without Alpine.js", async () => {
    const queryFn = vi
      .fn<QueryFunction<Todo[]>>()
      .mockResolvedValue([{ id: 1, title: "Learn Alpine Query" }]);
    const query = client.observe(["todos"], queryFn);

    expectTypeOf(query.data).toEqualTypeOf<Todo[] | undefined>();
    expectTypeOf(query.data).not.toBeAny();
    expectTypeOf(query).toEqualTypeOf<QueryObserver<Todo[]>>();

    expect(query.isLoading).toBe(true);

    await vi.runAllTimersAsync();

    expect(query.isSuccess).toBe(true);
    expect(query.data).toEqual([{ id: 1, title: "Learn Alpine Query" }]);
    query.destroy();
  });

  it("exposes devtools API", () => {
    expect(typeof client.devtools.subscribe).toBe("function");
    expect(typeof client.devtools.getSnapshot).toBe("function");
  });

  it("supports mutations without Alpine.js", async () => {
    const mutation = client.mutate({
      mutationFn: async ({ title }: { title: string }) => `created:${title}`,
    });

    const result = await mutation.mutate({ title: "Task" });

    expect(result).toBe("created:Task");
    expect(mutation.isSuccess).toBe(true);
  });

  describe("query dispatch overloads", () => {
    it("observe, fetch, and prefetch accept queryOptions definitions equivalently", async () => {
      const definition = queryOptions({
        queryKey: ["shared-def"] as const,
        queryFn: async (): Promise<string> => "from-definition",
        staleTime: 60_000,
      });

      const observed = client.observe(definition);
      await vi.runAllTimersAsync();
      expect(observed.data).toBe("from-definition");
      observed.destroy();

      client.reset();

      const fetched = client.fetch(definition);
      await vi.runAllTimersAsync();
      expect(fetched.data).toBe("from-definition");

      client.reset();

      await client.prefetch(definition);
      await vi.runAllTimersAsync();
      expect(client.get(["shared-def"])?.data).toBe("from-definition");
    });

    it("throws operation-specific errors when queryFn is missing", () => {
      const observeWithoutFn = client.observe as unknown as (
        key: QueryKey
      ) => ReturnType<QueryStore["observe"]>;
      const fetchWithoutFn = client.fetch as unknown as (
        key: QueryKey
      ) => ReturnType<QueryStore["fetch"]>;
      const prefetchWithoutFn = client.prefetch as unknown as (
        key: QueryKey
      ) => ReturnType<QueryStore["prefetch"]>;

      expect(() => observeWithoutFn(["key"])).toThrow(
        "queryFn is required when observe() is called with a query key"
      );
      expect(() => fetchWithoutFn(["key"])).toThrow(
        "queryFn is required when fetch() is called with a query key"
      );
      expect(() => prefetchWithoutFn(["key"])).toThrow(
        "queryFn is required when prefetch() is called with a query key"
      );
    });
  });
});
