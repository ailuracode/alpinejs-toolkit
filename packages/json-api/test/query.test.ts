import {
  createJsonApiClient,
  defineJsonApiSchema,
  jsonApiFindOneQueryOptions,
  jsonApiQueryOptions,
} from "@ailuracode/alpinejs-json-api";
import { createQueryClient } from "@ailuracode/alpinejs-query";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

const schema = defineJsonApiSchema({
  articles: {
    attributes: {} as { title: string },
    relationships: {
      author: { type: "people" as const },
    },
  },
  people: {
    attributes: {} as { name: string },
  },
});

const articlesCollection = {
  data: [
    {
      type: "articles",
      id: "1",
      attributes: { title: "First" },
      relationships: {
        author: { data: { type: "people", id: "9" } },
      },
    },
  ],
  included: [{ type: "people", id: "9", attributes: { name: "Dan Gebhardt" } }],
};

describe("jsonApiQueryOptions", () => {
  let client: ReturnType<typeof createQueryClient>;

  beforeEach(() => {
    vi.useFakeTimers();
    client = createQueryClient();
  });

  afterEach(() => {
    client.reset();
    vi.useRealTimers();
  });

  it("creates a collection query definition for observe()", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(articlesCollection), {
          status: 200,
          headers: { "content-type": "application/vnd.api+json" },
        })
      )
    );

    const jsonApiClient = createJsonApiClient(schema, {
      baseUrl: "http://example.com",
      fetcher,
    });

    const definition = jsonApiQueryOptions({
      client: jsonApiClient,
      resource: "articles",
      query: { include: ["author"] },
      queryKey: ["articles"] as const,
      staleTime: 60_000,
    });

    expectTypeOf(definition.queryKey).toEqualTypeOf<readonly ["articles"]>();

    type ArticlesDocument = Awaited<ReturnType<typeof definition.queryFn>>;

    type AuthorRelationship = NonNullable<
      NonNullable<ArticlesDocument["data"][number]["relationships"]>["author"]
    >;

    expectTypeOf<ArticlesDocument["data"][number]["attributes"]["title"]>().toBeString();
    expectTypeOf<AuthorRelationship["resolved"]>().toMatchTypeOf<{
      attributes: { name: string };
    } | null>();
    expectTypeOf<NonNullable<AuthorRelationship["resolved"]>["attributes"]["name"]>().toBeString();

    const query = client.observe(definition);
    await vi.runAllTimersAsync();

    expect(query.data?.data[0]?.relationships?.author?.resolved?.attributes.name).toBe(
      "Dan Gebhardt"
    );
    query.destroy();
  });

  it("creates a single-resource query definition when id is provided", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: articlesCollection.data[0],
            included: articlesCollection.included,
          }),
          {
            status: 200,
            headers: { "content-type": "application/vnd.api+json" },
          }
        )
      )
    );

    const jsonApiClient = createJsonApiClient(schema, {
      baseUrl: "http://example.com",
      fetcher,
    });

    const definition = jsonApiFindOneQueryOptions({
      client: jsonApiClient,
      resource: "articles",
      id: "1",
      queryKey: ["articles", 1] as const,
    });

    expectTypeOf(definition.queryFn).returns.resolves.toMatchObjectType<{
      data: {
        id: string;
        attributes: { title: string };
      };
    }>();

    const query = client.observe(definition);
    await vi.runAllTimersAsync();

    expect(query.data?.data.id).toBe("1");
    query.destroy();
  });
});
