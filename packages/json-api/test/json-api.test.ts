import {
  createJsonApiClient,
  defineJsonApiSchema,
  JsonApiHttpError,
} from "@ailuracode/alpinejs-json-api";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { JsonApiClient, JsonApiCreatePayload } from "../src/types.js";

const schema = defineJsonApiSchema({
  articles: {
    attributes: {} as { title: string; body: string },
    relationships: {
      author: { type: "people" as const },
      comments: { type: "comments" as const, many: true },
    },
  },
  people: {
    attributes: {} as { name: string },
  },
  comments: {
    attributes: {} as { body: string },
    relationships: {
      author: { type: "people" as const },
    },
  },
});

const articleDocument = {
  data: {
    type: "articles",
    id: "1",
    attributes: { title: "JSON:API paints my bikeshed!", body: "..." },
    relationships: {
      author: { data: { type: "people", id: "9" } },
      comments: { data: [{ type: "comments", id: "5" }] },
    },
  },
  included: [
    { type: "people", id: "9", attributes: { name: "Dan Gebhardt" } },
    { type: "comments", id: "5", attributes: { body: "First!" } },
  ],
};

const articlesCollection = {
  data: [
    {
      type: "articles",
      id: "1",
      attributes: { title: "First", body: "One" },
    },
    {
      type: "articles",
      id: "2",
      attributes: { title: "Second", body: "Two" },
    },
  ],
  links: {
    self: "/articles",
    next: "/articles?page[number]=2",
  },
};

function createMockFetcher(responseByUrl: Record<string, Response>): typeof fetch {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const key = `${method} ${url}`;
    const response = responseByUrl[key];

    if (!response) {
      throw new Error(`Unexpected request: ${key}`);
    }

    return Promise.resolve(response);
  }) as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/vnd.api+json" },
  });
}

describe("@ailuracode/alpinejs-json-api", () => {
  it("findAll() parses a typed collection document", async () => {
    const fetcher = createMockFetcher({
      "GET http://example.com/articles": jsonResponse(articlesCollection),
    });

    const client = createJsonApiClient(schema, {
      baseUrl: "http://example.com",
      fetcher,
    });

    const result = await client.findAll("articles");

    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.attributes.title).toBe("First");
    expect(result.links?.next).toBe("/articles?page[number]=2");
    expect(fetcher).toHaveBeenCalledWith(
      "http://example.com/articles",
      expect.objectContaining({
        method: "GET",
      })
    );
    const [, findAllInit] = vi.mocked(fetcher).mock.calls[0] ?? [];
    expect((findAllInit?.headers as Headers).get("Accept")).toBe("application/vnd.api+json");
  });

  it("findOne() supports include, fields, sort, page, and filter query params", async () => {
    const fetcher = createMockFetcher({
      "GET http://example.com/articles/1?include=author%2Ccomments&fields%5Barticles%5D=title%2Cbody&fields%5Bpeople%5D=name&sort=-created&page%5Bnumber%5D=1&page%5Bsize%5D=10&filter%5Bpublished%5D=true":
        jsonResponse(articleDocument),
    });

    const client = createJsonApiClient(schema, {
      baseUrl: "http://example.com",
      fetcher,
    });

    const result = await client.findOne("articles", "1", {
      include: ["author", "comments"],
      fields: {
        articles: ["title", "body"],
        people: ["name"],
      },
      sort: ["-created"],
      page: { number: 1, size: 10 },
      filter: { published: true },
    });

    expect(result.data.id).toBe("1");
    expect(result.data.attributes.title).toBe("JSON:API paints my bikeshed!");
    expect(result.included).toHaveLength(2);
    expect(result.data.relationships?.author?.data).toEqual({ type: "people", id: "9" });
    expect(result.data.relationships?.author?.resolved?.attributes.name).toBe("Dan Gebhardt");
    expect(result.data.relationships?.comments?.resolved?.[0]?.attributes.body).toBe("First!");
  });

  it("create(), update(), and delete() send JSON:API request bodies and headers", async () => {
    const fetcher = createMockFetcher({
      "POST http://example.com/articles": jsonResponse({
        data: {
          type: "articles",
          id: "3",
          attributes: { title: "Created", body: "New" },
        },
      }),
      "PATCH http://example.com/articles/3": jsonResponse({
        data: {
          type: "articles",
          id: "3",
          attributes: { title: "Updated", body: "Changed" },
        },
      }),
      "DELETE http://example.com/articles/3": new Response(null, { status: 204 }),
    });

    const client = createJsonApiClient(schema, {
      baseUrl: "http://example.com",
      fetcher,
    });

    const created = await client.create("articles", {
      attributes: { title: "Created", body: "New" },
      relationships: {
        author: { data: { type: "people", id: "9" } },
      },
    });

    expect(created.data.attributes.title).toBe("Created");

    const [, createInit] = vi.mocked(fetcher).mock.calls[0] ?? [];
    expect(createInit?.method).toBe("POST");
    expect((createInit?.headers as Headers).get("Accept")).toBe("application/vnd.api+json");
    expect((createInit?.headers as Headers).get("Content-Type")).toBe("application/vnd.api+json");
    expect(JSON.parse(String(createInit?.body))).toEqual({
      data: {
        type: "articles",
        attributes: { title: "Created", body: "New" },
        relationships: {
          author: { data: { type: "people", id: "9" } },
        },
      },
    });

    const updated = await client.update("articles", "3", {
      attributes: { title: "Updated" },
    });

    expect(updated.data.attributes.title).toBe("Updated");

    await expect(client.delete("articles", "3")).resolves.toBeUndefined();
  });

  it("throws JsonApiHttpError with parsed JSON:API errors", async () => {
    const fetcher = createMockFetcher({
      "GET http://example.com/articles/missing": jsonResponse(
        {
          errors: [
            {
              status: "404",
              title: "Not Found",
              detail: "Article missing",
            },
          ],
        },
        404
      ),
    });

    const client = createJsonApiClient(schema, {
      baseUrl: "http://example.com",
      fetcher,
    });

    const error = await client.findOne("articles", "missing").catch((caught) => caught);

    expect(error).toBeInstanceOf(JsonApiHttpError);
    expect((error as JsonApiHttpError).status).toBe(404);
    expect((error as JsonApiHttpError).errors[0]?.detail).toBe("Article missing");
  });
});

describe("@ailuracode/alpinejs-json-api type inference", () => {
  it("infers resource attributes and relationship targets from schema", () => {
    type Schema = typeof schema;
    type Client = JsonApiClient<Schema>;

    function fetchArticle(client: Client) {
      return client.findOne("articles", "1", { include: ["author"] });
    }

    type ArticleDocument = Awaited<ReturnType<typeof fetchArticle>>;

    expectTypeOf<ArticleDocument["data"]["type"]>().toEqualTypeOf<"articles">();
    expectTypeOf<ArticleDocument["data"]["attributes"]>().toEqualTypeOf<{
      title: string;
      body: string;
    }>();
    type AuthorRelationship = NonNullable<
      NonNullable<ArticleDocument["data"]["relationships"]>["author"]
    >;

    expectTypeOf<AuthorRelationship["resolved"]>().toMatchTypeOf<{
      type: "people";
      attributes: { name: string };
    } | null>();
    expectTypeOf<NonNullable<AuthorRelationship["resolved"]>["attributes"]["name"]>().toBeString();
  });

  it("types create payloads from schema attributes and relationships", () => {
    type Schema = typeof schema;
    type Client = JsonApiClient<Schema>;

    function createArticle(client: Client) {
      return client.create("articles", {
        attributes: { title: "Hello", body: "World" },
        relationships: {
          author: { data: { type: "people", id: "9" } },
        },
      });
    }

    type CreateInput = JsonApiCreatePayload<Schema, "articles">;

    type AuthorRelationship = NonNullable<NonNullable<CreateInput["relationships"]>["author"]>;

    expectTypeOf<CreateInput["attributes"]>().toEqualTypeOf<{ title: string; body: string }>();
    expectTypeOf<AuthorRelationship["data"]>().toEqualTypeOf<{
      type: "people";
      id: string;
    } | null>();
    expectTypeOf<
      Awaited<ReturnType<typeof createArticle>>["data"]["type"]
    >().toEqualTypeOf<"articles">();
  });
});
