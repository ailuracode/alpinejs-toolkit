import {
  createQueryClient,
  mutationOptions,
  queryFn,
  queryKey,
  queryOptions,
  typedFetch,
} from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import type { QueryFunction } from "../src/types.js";

type Todo = { id: number; title: string };

describe("@ailuracode/alpine-query type inference", () => {
  let client: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    vi.useFakeTimers();
    client = createQueryClient();
  });

  afterEach(() => {
    client.reset();
    vi.useRealTimers();
  });

  it("infers query data from queryFn return type", () => {
    const query = client.observe(
      ["todos"],
      async (): Promise<Todo[]> => [{ id: 1, title: "Learn" }]
    );

    expectTypeOf(query.data).toEqualTypeOf<Todo[] | undefined>();
    expectTypeOf(query.refetch).returns.toEqualTypeOf<Promise<void>>();
  });

  it("infers data from async functions without an explicit Promise annotation", () => {
    const query = client.observe(["todos"], async () => [{ id: 1, title: "Learn" } satisfies Todo]);

    expectTypeOf(query.data).toEqualTypeOf<Todo[] | undefined>();
  });

  it("infers data when delegating to a typed fetch helper", () => {
    function fetchTodos(): Promise<Todo[]> {
      return typedFetch<Todo[]>("/api/todos");
    }

    const query = client.observe(["todos"], () => fetchTodos());

    expectTypeOf(query.data).toEqualTypeOf<Todo[] | undefined>();
  });

  it("infers literal query keys via queryKey()", () => {
    const key = queryKey(["todos", 1] as const);

    expectTypeOf(key).toEqualTypeOf<readonly ["todos", 1]>();
  });

  it("infers queryOptions key and data types", () => {
    const definition = queryOptions({
      queryKey: ["todos", 1] as const,
      queryFn: async (): Promise<Todo> => ({ id: 1, title: "Learn" }),
      staleTime: 60_000,
    });

    expectTypeOf(definition.queryKey).toEqualTypeOf<readonly ["todos", 1]>();
    expectTypeOf(definition.queryFn).returns.resolves.toEqualTypeOf<Todo>();
  });

  it("infers mutation variables and result from mutationFn", () => {
    const options = mutationOptions({
      mutationFn: async (variables: { title: string }) => `created:${variables.title}`,
    });

    expectTypeOf(options.mutationFn).parameters.toEqualTypeOf<[{ title: string }]>();
    expectTypeOf(options.mutationFn).returns.resolves.toEqualTypeOf<string>();

    const mutation = client.mutate(options);
    expectTypeOf(mutation.mutate).parameters.toEqualTypeOf<[variables: { title: string }]>();
    expectTypeOf(mutation.data).toEqualTypeOf<string | undefined>();
  });

  it("observe() accepts queryOptions definitions", async () => {
    const definition = queryOptions({
      queryKey: ["profile"] as const,
      queryFn: async (): Promise<string> => "cached",
      staleTime: 60_000,
    });

    const query = client.observe(definition);
    expectTypeOf(query.data).toEqualTypeOf<string | undefined>();

    await vi.runAllTimersAsync();

    expect(query.data).toBe("cached");
    query.destroy();
  });

  it("types untyped mocks as unknown instead of any", () => {
    const queryFn = vi.fn().mockResolvedValue([{ id: 1, title: "Learn" }]);
    const query = client.observe(["todos"], queryFn);

    expectTypeOf(query.data).toEqualTypeOf<unknown | undefined>();
    expectTypeOf(query.data).not.toBeAny();
  });

  it("infers typed mocks and explicit generics", () => {
    const typedMock = vi.fn<QueryFunction<Todo[]>>().mockResolvedValue([{ id: 1, title: "Learn" }]);
    const fromTypedMock = client.observe(["todos"], typedMock);
    expectTypeOf(fromTypedMock.data).toEqualTypeOf<Todo[] | undefined>();

    const looseMock = vi.fn().mockResolvedValue([{ id: 1, title: "Learn" }]);
    const fromGeneric = client.observe<Todo[]>(["todos"], looseMock);
    expectTypeOf(fromGeneric.data).toEqualTypeOf<Todo[] | undefined>();

    const wrapped = queryFn(async (): Promise<Todo[]> => [{ id: 1, title: "Learn" }]);
    const fromHelper = client.observe(["todos"], wrapped);
    expectTypeOf(fromHelper.data).toEqualTypeOf<Todo[] | undefined>();
  });

  it("does not infer untyped mock mutationFn variables as any", () => {
    const mutationFn = vi.fn().mockResolvedValue("ok");
    const mutation = client.mutate({ mutationFn });

    expectTypeOf(mutation.data).toEqualTypeOf<unknown | undefined>();
    expectTypeOf(mutation.mutate).parameters.toEqualTypeOf<[variables: unknown]>();
    expectTypeOf(mutation.data).not.toBeAny();
  });
});
