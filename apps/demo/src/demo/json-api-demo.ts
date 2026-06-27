import {
  createJsonApiClient,
  defineJsonApiSchema,
  type JsonApiCollectionDocument,
  type JsonApiSingleDocument,
  jsonApiFindOneQueryOptions,
  jsonApiQueryOptions,
} from "@ailuracode/alpinejs-json-api";
import type { QueryState, QueryStore } from "@ailuracode/alpinejs-query";
import type { AlpineInstance } from "../types/alpine.js";
import { createJsonApiMockFetcher } from "./json-api-mock.js";

export const jsonApiSchema = defineJsonApiSchema({
  articles: {
    attributes: {} as { title: string; body: string },
    relationships: {
      author: { type: "people" as const },
    },
  },
  people: {
    attributes: {} as { name: string },
  },
});

type ArticlesDocument = JsonApiCollectionDocument<typeof jsonApiSchema, "articles">;
type ArticleDocument = JsonApiSingleDocument<typeof jsonApiSchema, "articles">;
type ArticlesQuery = QueryState<ArticlesDocument> & { destroy(): void };
type ArticleQuery = QueryState<ArticleDocument> & { destroy(): void };

type JsonApiDemoRow = {
  id: string;
  title: string;
  author: string;
};

type JsonApiDemoData = {
  query: ArticlesQuery | null;
  detailQuery: ArticleQuery | null;
  selectedId: string | null;
  sort: "title" | "-title";
  rows: JsonApiDemoRow[];
  init(): void;
  destroy(): void;
  selectArticle(id: string): void;
  clearDetail(): void;
  toggleSort(): void;
  reloadList(): void;
  createArticle(): Promise<void>;
  updateSelected(): Promise<void>;
  deleteSelected(): Promise<void>;
};

export const jsonApiDemoOptions = {
  schema: jsonApiSchema,
  baseUrl: "/json-api",
  fetcher: createJsonApiMockFetcher(),
};

export const jsonApiClient = createJsonApiClient(jsonApiSchema, jsonApiDemoOptions);

function articlesListDefinition(sort: "title" | "-title") {
  return jsonApiQueryOptions({
    client: jsonApiClient,
    resource: "articles",
    query: { include: ["author"], sort: [sort] },
    queryKey: ["json-api", "articles", sort] as const,
    staleTime: 5 * 60_000,
  });
}

export function registerJsonApiDemo(Alpine: AlpineInstance): void {
  Alpine.data(
    "jsonApiDemo",
    (): JsonApiDemoData => ({
      query: null,
      detailQuery: null,
      selectedId: null,
      sort: "title",
      get rows(): JsonApiDemoRow[] {
        return (this.query?.data?.data ?? []).map((article) => ({
          id: article.id,
          title: article.attributes.title,
          author: article.relationships?.author?.resolved?.attributes.name ?? "Unknown",
        }));
      },
      init() {
        this.reloadList();
      },
      reloadList() {
        const store = Alpine.store("query") as QueryStore;

        this.query?.destroy();
        this.query = store.observe(articlesListDefinition(this.sort));
      },
      toggleSort() {
        this.sort = this.sort === "title" ? "-title" : "title";
        this.reloadList();
      },
      selectArticle(id: string) {
        const store = Alpine.store("query") as QueryStore;

        this.selectedId = id;
        this.detailQuery?.destroy();
        this.detailQuery = store.observe(
          jsonApiFindOneQueryOptions({
            client: jsonApiClient,
            resource: "articles",
            id,
            query: { include: ["author"] },
            queryKey: ["json-api", "articles", id] as const,
            staleTime: 5 * 60_000,
          })
        );
      },
      clearDetail() {
        this.detailQuery?.destroy();
        this.detailQuery = null;
        this.selectedId = null;
      },
      async createArticle() {
        await jsonApiClient.create("articles", {
          attributes: {
            title: `Article ${Date.now()}`,
            body: "Created via client.create()",
          },
        });
        this.reloadList();
      },
      async updateSelected() {
        if (!(this.selectedId && this.detailQuery?.data)) {
          return;
        }

        const title = this.detailQuery.data.data.attributes.title;

        await jsonApiClient.update("articles", this.selectedId, {
          attributes: { title: `${title} (edited)` },
        });
        this.reloadList();
        this.selectArticle(this.selectedId);
      },
      async deleteSelected() {
        if (!this.selectedId) {
          return;
        }

        const id = this.selectedId;
        this.clearDetail();
        await jsonApiClient.delete("articles", id);
        this.reloadList();
      },
      destroy() {
        this.query?.destroy();
        this.detailQuery?.destroy();
        this.query = null;
        this.detailQuery = null;
      },
    })
  );
}
