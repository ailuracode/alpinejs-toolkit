---
title: "Query adapter (Alpine)"
description: "Adaptador nativo Alpine.reactive para @ailuracode/alpine-query."
---

Package: `@ailuracode/alpine-query-adapter-alpine`

Adaptador nativo [`Alpine.reactive`](https://alpinejs.dev) para [`@ailuracode/alpine-query`](/query/).

Sem biblioteca de store externa. Ideal quando quer a menor pegada de dependências.

## Instalação

```bash
pnpm add @ailuracode/alpine-query-adapter-alpine @ailuracode/alpine-core alpinejs
```

## Início rápido

```ts
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";

Alpine.plugin(query({ adapter: createAlpineStoreAdapter }));
Alpine.start();
```

### Evitar colisões de nomes

Se a sua aplicação já usa `$store.query` — ou outro plugin do toolkit registra esse nome — renomeie a superfície de integração sem tocar na cache de queries:

```ts
Alpine.plugin(query({ adapter: createAlpineStoreAdapter, storeKey: "cache" })); // → $store.cache
```

A constante exposta `DEFAULT_QUERY_STORE_KEY` mantém a renomeação descobrível via TypeScript.

## Exportações

| Exportação | Descrição |
|--------|-------------|
| `createAlpineStoreAdapter` | Factory para `query({ adapter })` |
| `alpineStoreQueryAdapter` | Alias de `createAlpineStoreAdapter` |
| `default` | Plugin de conveniência que envolve `query({ adapter })` |
| `DEFAULT_QUERY_STORE_KEY` | Chave padrão de `$store.query` |
| `CreateQueryPluginOptions` | Opções aceites por `createQueryPlugin` |
| `QueryRegisterOptions` | Opções aceites por `query({...})` |

## Nota de integração

Não existe um pacote `@alpinejs/store` separado — este adaptador usa os objetos reativos nativos do Alpine diretamente.
