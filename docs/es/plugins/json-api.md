---
title: "JSON:API"
description: "Cliente JSON:API tipado con el magic $jsonapi."
---

Cliente JSON:API fuertemente tipado para Alpine.js.

## Instalación

```bash
npm install @ailuracode/alpinejs-json-api @ailuracode/alpinejs-query alpinejs
```

## Tipos basados en esquema

`defineJsonApiSchema()` ingiere tu mapa de recursos y preserva las claves literales `type`, las formas de atributos y los destinos de relaciones:

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

`createJsonApiClient()` y `$jsonapi` infieren:

- `attributes` para cada tipo de recurso
- nombres de relaciones y tipos de recurso destino
- payloads de `include`, `fields`, `create` y `update`

## Alpine plugin

```js
import jsonApi from "@ailuracode/alpinejs-json-api";

Alpine.plugin(jsonApi({ schema, baseUrl: "/api" }));
```

Registra el magic `$jsonapi` con el cliente configurado.

## Características JSON:API

- Cabeceras `Accept` / `Content-Type` `application/vnd.api+json`
- Documentos compuestos (`included`)
- Conjuntos de campos dispersos (`fields[type]=a,b`)
- Parámetros de consulta `include`, `sort`, `page` y `filter`
- Documentos de error JSON:API mediante `JsonApiHttpError`
- Hidratación automática de `relationships.*.resolved` desde documentos compuestos `included`
- Construido sobre `typedFetch` de `@ailuracode/alpinejs-query`

## Integración con caché de consultas

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

// Recurso individual
const article = jsonApiFindOneQueryOptions({
  client: $jsonapi,
  resource: "articles",
  id: articleId,
  queryKey: ["articles", articleId] as const,
});
```

Las relaciones resueltas están disponibles en `data[].relationships.author.resolved` tras obtener documentos compuestos con `include`.

## Ver también

- [Especificación JSON:API](https://jsonapi.org/format/)
- [@ailuracode/alpinejs-query](../query.md)
