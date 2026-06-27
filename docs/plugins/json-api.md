---
title: "JSON:API"
description: "Strongly typed JSON:API client for Alpine.js."
---

Strongly typed JSON:API client for Alpine.js.

## Install

```bash
npm install @ailuracode/alpinejs-json-api @ailuracode/alpinejs-query alpinejs
```

## Schema-driven types

`defineJsonApiSchema()` ingests your resource map and preserves literal `type` keys, attribute shapes, and relationship targets:

```ts
import { defineJsonApiSchema, createJsonApiClient } from "@ailuracode/alpinejs-json-api";

const schema = defineJsonApiSchema({
  articles: {
    attributes: {} as { title: string; body: string },
    relationships: {
      author: { type: "people" },
      comments: { type: "comments", many: true },
    },
  },
  people: {
    attributes: {} as { name: string },
  },
  comments: {
    attributes: {} as { body: string },
  },
});

const client = createJsonApiClient(schema, { baseUrl: "https://api.example.com" });
```

`createJsonApiClient()` and `$jsonapi` infer:

- `attributes` for each resource type
- relationship names and target resource types
- `include`, `fields`, `create`, and `update` payloads

## Alpine plugin

```js
import jsonApi from "@ailuracode/alpinejs-json-api";

Alpine.plugin(jsonApi({ schema, baseUrl: "/api" }));
```

Registers magic `$jsonapi` with the configured client.

## JSON:API features

- `application/vnd.api+json` `Accept` / `Content-Type` headers
- Compound documents (`included`)
- Sparse fieldsets (`fields[type]=a,b`)
- `include`, `sort`, `page`, and `filter` query params
- JSON:API error documents via `JsonApiHttpError`
- Automatic `relationships.*.resolved` hydration from compound `included` documents
- Built on `typedFetch` from `@ailuracode/alpinejs-query`

## Query cache integration

```js
import { jsonApiQueryOptions } from "@ailuracode/alpinejs-json-api";

const articles = jsonApiQueryOptions({
  client: $jsonapi,
  resource: "articles",
  query: { include: ["author"] },
  queryKey: ["articles"] as const,
  staleTime: 60_000,
});

$store.query.observe(articles);

// Single resource
const article = jsonApiFindOneQueryOptions({
  client: $jsonapi,
  resource: "articles",
  id: articleId,
  queryKey: ["articles", articleId] as const,
});
```

Resolved relationships are available on `data[].relationships.author.resolved` after `include` fetches compound documents.

## See also

- [JSON:API specification](https://jsonapi.org/format/)
- [@ailuracode/alpinejs-query](../query.md)
