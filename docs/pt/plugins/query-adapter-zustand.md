---
title: "Query adapter (Zustand)"
description: "Adaptador Zustand vanilla para @ailuracode/alpine-query, com ponte manual para Alpine.reactive."
---

Package: `@ailuracode/alpine-query-adapter-zustand`

Adaptador de store vanilla [Zustand](https://github.com/pmndrs/zustand) para [`@ailuracode/alpine-query`](/query/).

**Não existe integração oficial zustand-alpine.** Este pacote usa a API vanilla `createStore` do Zustand e liga as subscrições a `Alpine.reactive`.

## Instalação

```bash
pnpm add @ailuracode/alpine-query-adapter-zustand @ailuracode/alpine-query alpinejs zustand
```

## Início rápido

```ts
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import { createAlpineZustandAdapter } from "@ailuracode/alpine-query-adapter-zustand";

Alpine.plugin(query({ adapter: createAlpineZustandAdapter }));
Alpine.start();
```

## Exportações

| Exportação | Descrição |
|--------|-------------|
| `zustandQueryAdapter` | Adaptador para `createQueryClient({ adapter })` |
| `createAlpineZustandAdapter` | Factory para `query({ adapter })` |
| `default` | Plugin de conveniência que envolve `query({ adapter })` |

## Nota de integração

Existem adaptadores de terceiros do Zustand para React, Lit e Angular — mas não para Alpine.js. Este pacote liga `store.subscribe()` → `Alpine.reactive`.
