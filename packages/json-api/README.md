# @ailuracode/alpinejs-json-api

Strongly typed [JSON:API](https://jsonapi.org/) client for Alpine.js. Define your resource schema once and get inferred attributes, relationships, and query options across `findAll`, `findOne`, `create`, `update`, and `delete`.

## Install

```bash
npm install @ailuracode/alpinejs-json-api @ailuracode/alpinejs-query alpinejs
```

## Quick start

```js
import Alpine from "alpinejs";
import jsonApi, { defineJsonApiSchema } from "@ailuracode/alpinejs-json-api";

const schema = defineJsonApiSchema({
  articles: {
    attributes: {} as { title: string; body: string },
    relationships: {
      author: { type: "people" },
    },
  },
  people: {
    attributes: {} as { name: string },
  },
});

Alpine.plugin(
  jsonApi({
    schema,
    baseUrl: "/api",
  })
);

Alpine.start();
```

```html
<div
  x-data="{
    articles: null,
    async load() {
      this.articles = await $jsonapi.findAll('articles', {
        include: ['author'],
        fields: { articles: ['title'] },
      });
    },
  }"
  x-init="load()"
>
  <template x-if="articles">
    <ul>
      <template x-for="article in articles.data" :key="article.id">
        <li x-text="article.attributes.title"></li>
      </template>
    </ul>
  </template>
</div>
```

## With `@ailuracode/alpinejs-query`

```js
$store.query.observe(["articles"], () => $jsonapi.findAll("articles"));
```

## API

| Export | Description |
|--------|-------------|
| `jsonApi(options)` | Alpine plugin — registers `$jsonapi` |
| `defineJsonApiSchema(schema)` | Preserves literal resource types for inference |
| `createJsonApiClient(schema, options)` | Store-agnostic typed client |
| `JsonApiHttpError` | JSON:API error document with parsed `errors` |

### Client methods

| Method | Description |
|--------|-------------|
| `findAll(type, query?)` | Fetch a collection |
| `findOne(type, id, query?)` | Fetch a single resource |
| `create(type, payload)` | `POST` a new resource |
| `update(type, id, payload)` | `PATCH` a resource |
| `delete(type, id)` | `DELETE` a resource |
| `jsonApiQueryOptions({ client, resource, queryKey, ... })` | Build a typed collection `queryOptions` definition |
| `jsonApiFindOneQueryOptions({ client, resource, id, queryKey, ... })` | Build a typed single-resource `queryOptions` definition |

Relationships in responses include a `resolved` field populated automatically from compound `included` documents.

Query options support `include`, sparse `fields`, `sort`, `page`, and `filter` parameters per the JSON:API spec.

## TypeScript

```ts
/// <reference types="@ailuracode/alpinejs-json-api/global" />
```

## License

MIT
