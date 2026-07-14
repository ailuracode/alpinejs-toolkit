---
title: Composição da query stack
description: Escolha entre o núcleo agnóstico a framework, adapters Alpine e Zustand, e o bundle query kit recomendado.
---

A família Query Stack empilha um cache agnóstico a stores com adapters de reatividade plugáveis e um bundle recomendado opcional para apps Alpine.

## Papéis dos pacotes

| Pacote | Papel | Quando instalar |
|--------|-------|-----------------|
| `@ailuracode/alpine-query` | Fundação | Você precisa apenas do motor de cache ou de um adapter customizado |
| `@ailuracode/alpine-query-adapter-alpine` | Adapter | Integração nativa com `Alpine.reactive` |
| `@ailuracode/alpine-query-adapter-zustand` | Adapter | Stores vanilla Zustand conectadas ao Alpine |
| `@ailuracode/alpine-query-kit` | Bundle | **Recomendado** para apps Alpine — core, adapter Nanostores, reexportações e entrada devtools |

O núcleo neutro em relação a framework **não** exige Alpine. Adapters e o kit adicionam wiring amigável ao Alpine por cima.

## Configuração Alpine recomendada

```ts
import Alpine from "alpinejs";
import { queryKitPlugin } from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKitPlugin());
Alpine.start();
```

Use `query({ adapter })` da reexportação do kit quando precisar de controle explícito de adapter em exemplos ou testes.

## Devtools

Query Devtools são distribuídos por `@ailuracode/alpine-query-kit/devtools` e são ferramentas de desenvolvimento opcionais. Importe a entrada devtools apenas em builds de desenvolvimento.

## Demos relacionadas

- [Playground da família Query Stack](/playground/data-networking/query-stack/)
- [Demo do query core](/playground/query/)
- [Demo do query kit](/playground/query-kit/)
