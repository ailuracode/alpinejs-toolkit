---
title: "Query devtools"
description: "Painel de devtools do navegador para inspecionar entradas de cache, flags de status e mutações do @ailuracode/alpinejs-query."
---

Painel de devtools do navegador para inspecionar entradas de cache, flags de status e mutações do `@ailuracode/alpinejs-query`.

## Instalação

```bash
npm install @ailuracode/alpinejs-query-devtools @ailuracode/alpinejs-query @ailuracode/alpinejs-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpinejs-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpinejs-query-adapter-nanostores";

import queryDevtools from "@ailuracode/alpinejs-query-devtools";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.plugin(queryDevtools());
Alpine.start();
```

Consulte o [README do pacote](../packages/query-devtools/README.md) para opções e montagem imperativa.

## Compatibilidade

As devtools consomem a API headless `$store.query.devtools` (`subscribe`, `getSnapshot`) e os métodos do store `get`, `invalidate` e `remove`. Funcionam com qualquer query adapter plugin:

- **Plugin Alpine** — registre um query adapter plugin, depois `queryDevtools()`; o painel resolve `$store.query` em `alpine:initialized`.
- **`createQueryClient()`** — passe o cliente para `mountQueryDevtools({ store: getQueryStore(client) })` sem Alpine.

## O que você pode inspecionar

- Query keys e `data` serializada
- `status`, `fetchStatus`, `isLoading`, `isFetching`, `isStale`, contagem de observadores
- Opções de query resolvidas (`staleTime`, `gcTime`, `retry`, …)
- Variáveis, resultados e erros de mutações
- Atualizações ao vivo via `$store.query.devtools.subscribe()`
- Canto do botão toggle (`top-left`, `top-right`, `bottom-left`, `bottom-right`) com persistência em `localStorage`

## Produção

Carregue as devtools apenas em desenvolvimento:

```js
if (import.meta.env.DEV) {
  const { default: queryDevtools } = await import("@ailuracode/alpinejs-query-devtools");
  Alpine.plugin(queryDevtools());
}
```

## Veja também

- [@ailuracode/alpinejs-query](./query.md)
- [TanStack Query Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
