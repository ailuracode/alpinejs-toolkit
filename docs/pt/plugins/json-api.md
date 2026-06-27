---
title: "JSON:API"
description: "Cliente JSON:API tipado com o magic $jsonapi."
---

Cliente JSON:API fortemente tipado para Alpine.js.

## Instalação

```bash
npm install @ailuracode/alpinejs-json-api @ailuracode/alpinejs-query alpinejs
```

## Tipos orientados por schema

`defineJsonApiSchema()` ingere seu mapa de recursos e preserva chaves literais de `type`, formas de atributos e destinos de relacionamentos:

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

`createJsonApiClient()` e `$jsonapi` inferem:

- `attributes` para cada tipo de recurso
- nomes de relacionamentos e tipos de recurso de destino
- payloads de `include`, `fields`, `create` e `update`

## Alpine plugin

```js
import jsonApi from "@ailuracode/alpinejs-json-api";

Alpine.plugin(jsonApi({ schema, baseUrl: "/api" }));
```

Registra o magic `$jsonapi` com o cliente configurado.

## Recursos JSON:API

- Cabeçalhos `Accept` / `Content-Type` `application/vnd.api+json`
- Documentos compostos (`included`)
- Sparse fieldsets (`fields[type]=a,b`)
- Parâmetros de query `include`, `sort`, `page` e `filter`
- Documentos de erro JSON:API via `JsonApiHttpError`
- Hidratação automática de `relationships.*.resolved` a partir de documentos `included` compostos
- Construído sobre `typedFetch` de `@ailuracode/alpinejs-query`

## Integração com cache de queries

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

// Recurso único
const article = jsonApiFindOneQueryOptions({
  client: $jsonapi,
  resource: "articles",
  id: articleId,
  queryKey: ["articles", articleId] as const,
});
```

Relacionamentos resolvidos ficam disponíveis em `data[].relationships.author.resolved` após `include` buscar documentos compostos.

## Veja também

- [Especificação JSON:API](https://jsonapi.org/format/)
- [@ailuracode/alpinejs-query](../query.md)
