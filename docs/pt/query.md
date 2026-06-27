---
title: "Query"
description: "Obtenção assíncrona de dados no estilo TanStack Query para Alpine.js: cache, stale-while-revalidate, invalidação, retentativas, polling e mutações."
---

Obtenção assíncrona de dados no estilo TanStack Query para Alpine.js: cache, stale-while-revalidate, invalidação, retentativas, polling e mutações.

## Instalação

```bash
npm install @ailuracode/alpinejs-query @ailuracode/alpinejs-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

## Início rápido

Escolha um adaptador, passe-o para `query()` e registre o plugin. **Nanostores** é recomendado (`@nanostores/alpine` fornece `x-nano` e `$nano`):

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpinejs-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpinejs-query-adapter-nanostores";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.start();
```

Outros pacotes adaptador:

| Package | Backend |
|---------|---------|
| `@ailuracode/alpinejs-query-adapter-nanostores` | Nanostores + `@nanostores/alpine` (**recomendado**) |
| `@ailuracode/alpinejs-query-adapter-alpine` | `Alpine.reactive` nativo |
| `@ailuracode/alpinejs-query-adapter-zustand` | Zustand vanilla (ponte manual; sem zustand-alpine oficial) |

### Sem Alpine

`createQueryClient()` expõe a mesma API sem registrar `$store.query`. O core de cache é **agnóstico ao store** — passe qualquer `QueryStateAdapter` ou use o default vanilla.

```js
import { createQueryClient, vanillaQueryAdapter } from "@ailuracode/alpinejs-query";
import { nanostoresQueryAdapter } from "@ailuracode/alpinejs-query-adapter-nanostores";

const query = createQueryClient({ adapter: nanostoresQueryAdapter });
const todos = query.observe(["todos"], fetchTodos);
```

```html
<div
  x-data="{
    todos: $store.query.observe(['todos'], () => typedFetch('/api/todos')),
  }"
>
  <p x-show="todos.isLoading">Loading…</p>
  <ul x-show="todos.isSuccess">
    <template x-for="todo in todos.data" :key="todo.id">
      <li x-text="todo.title"></li>
    </template>
  </ul>
</div>
```

Mantenha o objeto query aninhado (ex.: `todos.isLoading`) — não faça spread de `observe()` em `x-data`, ou getters como `isSuccess` não funcionarão.

### Paginação

Use o número da página na query key para que cada página seja cacheada de forma independente:

```html
<div
  x-data="{
    page: 1,
    pageSize: 12,
    query: null,
    loadPage() {
      this.query?.destroy?.();
      const page = this.page;
      this.query = $store.query.observe(
        ['pokemon', page],
        () =>
          typedFetch(
            `https://pokeapi.co/api/v2/pokemon?limit=${this.pageSize}&offset=${(page - 1) * this.pageSize}`
          ),
        { staleTime: 5 * 60_000 }
      );
    },
  }"
  x-init="loadPage()"
>
  <template x-if="query?.isSuccess">
    <ul>
      <template x-for="pokemon in query.data.results" :key="pokemon.name">
        <li x-text="pokemon.name"></li>
      </template>
    </ul>
  </template>
  <button type="button" @click="page--; loadPage()" x-bind:disabled="page <= 1">Previous</button>
  <button type="button" @click="page++; loadPage()" x-bind:disabled="!query?.data?.next">Next</button>
</div>
```

Voltar a uma página anterior serve dados cacheados instantaneamente enquanto `staleTime` não expirou.

Consulte o [README do pacote](../packages/query/README.md) para a API completa.

## Adaptador personalizado

O motor de cache conversa com sua biblioteca de store por meio de um **`QueryStateAdapter`**. Implemente esta interface para conectar qualquer runtime reativo — Redux, Pinia, Solid signals, um barramento de eventos personalizado, etc.

Todo adaptador deve expor um string **`name`** (ex.: `"Nanostores"`, `"Zustand"`). As devtools de query o exibem no cabeçalho do painel (`Alpine Query · YourName`).

### Contrato

Cada query e mutação cacheada recebe um **handle** com quatro responsabilidades:

| Método | Papel |
|--------|------|
| `get()` | Snapshot do registro raw (`data`, `status`, `fetchStatus`, …) |
| `patch(partial)` | Aplica atualizações de cache do motor |
| `listen(listener)` | Notifica quando o registro muda; retorna uma função unsubscribe |
| `state` | Visão reativa exposta aos consumidores (`observe()`, `mutate()`) |

Registros de query usam `QueryStateRecord<TData>`; mutações usam `MutationStateRecord<TData>`. O objeto `state` deve expor getters para esses campos mais flags booleanas (`isLoading`, `isSuccess`, …) e ações (`refetch`, `mutate`, `reset`).

### Exemplo mínimo (vanilla)

O `vanillaQueryAdapter` integrado é a referência mais simples — um objeto plano mais um conjunto de listeners:

```js
import {
  createQueryClient,
  createMutationStateView,
  createQueryStateView,
  vanillaQueryAdapter,
  type QueryStateAdapter,
} from "@ailuracode/alpinejs-query";

// Use as-is for tests or non-reactive environments
const client = createQueryClient({ adapter: vanillaQueryAdapter });
```

Consulte [`packages/query/src/adapters/vanilla.ts`](../packages/query/src/adapters/vanilla.ts) para a implementação completa.

### Adaptador respaldado por store

Quando sua biblioteca já possui estado reativo (Zustand, Nanostores, MobX, …), mantenha o **registro** no store e construa a **visão** com helpers do core:

```js
import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateAdapter,
  type QueryStateRecord,
} from "@ailuracode/alpinejs-query";

export const myStoreAdapter: QueryStateAdapter = {
  name: "My Store",

  createQueryState(initial, staleTime, refetch) {
    const record = { ...initial }; // or your store's map/set API
    const state = createQueryStateView(() => record, staleTime, refetch);
    const listeners = new Set();

    return {
      state,
      get: () => record,
      patch: (patch) => {
        Object.assign(record, patch);
        listeners.forEach((l) => l(record));
      },
      listen: (listener) => {
        listeners.add(listener);
        listener(record);
        return () => listeners.delete(listener);
      },
    };
  },

  createMutationState(handlers) {
    const record = { data: undefined, error: null, status: "idle" };
    const state = createMutationStateView(() => record, handlers);
    const listeners = new Set();

    return {
      state,
      get: () => record,
      patch: (patch) => {
        Object.assign(record, patch);
        listeners.forEach((l) => l(record));
      },
      listen: (listener) => {
        listeners.add(listener);
        listener(record);
        return () => listeners.delete(listener);
      },
    };
  },
};
```

Conecte o `subscribe` / `listen` nativo do store em `listen` em vez de um `Set` manual quando disponível. Adaptadores existentes:

- [`query-adapter-nanostores`](../packages/query-adapter-nanostores/src/adapter.ts) — Nanostores `map()`
- [`query-adapter-zustand`](../packages/query-adapter-zustand/src/adapter.ts) — Zustand vanilla `createStore`

### Plugin Alpine a partir de um adaptador personalizado

Registre `$store.query` com `query({ adapter })`:

```js
import query from "@ailuracode/alpinejs-query";
import { myStoreAdapter } from "./my-store-adapter.js";

Alpine.plugin(query({ adapter: myStoreAdapter }));
Alpine.start();
```

Se o adaptador **não** estiver já vinculado a templates Alpine, envolva-o com `createAlpineBridgedAdapter`:

```js
import query, { createAlpineBridgedAdapter } from "@ailuracode/alpinejs-query";

Alpine.plugin(
  query({ adapter: (Alpine) => createAlpineBridgedAdapter(Alpine, myStoreAdapter) })
);
```

Para armazenamento nativo com `Alpine.reactive`, use [`createAlpineStoreAdapter`](../packages/query-adapter-alpine/src/adapter.ts) como referência — chama `attachQueryFlags` / `attachMutationFlags` diretamente no objeto reativo.

### Factory de adaptador

`query({ adapter })` aceita uma factory `(Alpine) => QueryStateAdapter` quando o adaptador precisa da instância do Alpine no registro:

```js
query({ adapter: (Alpine) => createAlpineBridgedAdapter(Alpine, myStoreAdapter) });
```

### Publicar um pacote plugin

Os adaptadores oficiais são pacotes npm independentes (`@ailuracode/alpinejs-query-adapter-*`). Para publicar o seu:

1. Dependa de `@ailuracode/alpinejs-query` e da sua biblioteca de store.
2. Exporte o adaptador; consumidores chamam `query({ adapter })` de `@ailuracode/alpinejs-query`.
3. Adicione testes com `createQueryClient({ adapter })` e `startAlpine(query({ adapter }))`.

Apenas **`patch` + `listen`** precisam conectar ao seu store; o motor de cache cuida de fetch, retentativas, invalidação e GC.

## Conceitos

### Query keys

Arrays identificam entradas cacheadas. Use valores estáveis e serializáveis:

```js
['todos']
['todos', todoId]
['users', userId, 'posts']
```

### `observe()` vs `fetch()`

- **`observe()`** — para `x-data`. Assina a entrada de cache; chame `destroy()` quando a assinatura não for mais necessária (ex.: paginação) para que entradas possam ser coletadas.
- **`fetch()`** — fetch imperativo sem manter assinatura.

### Stale time e garbage collection

- **`staleTime`** — por quanto tempo dados cacheados são tratados como frescos.
- **`gcTime`** — por quanto tempo entradas não usadas permanecem na memória após desconectar todos os observadores.

### Mutações

`$store.query.mutate()` retorna um objeto de mutação reativo com `mutate()`, `reset()` e getters de status (`isPending`, `isSuccess`, …). Use `invalidate()` em `onSuccess` para atualizar queries relacionadas.

### `fetch` tipado

Use `typedFetch<T>()` dentro de callbacks `queryFn` em vez de chamar o `fetch` nativo e fazer cast de `response.json()`:

```ts
import { typedFetch } from "@ailuracode/alpinejs-query";

type Todo = { id: number; title: string };

const todos = query.observe(["todos"], () => typedFetch<Todo[]>("/api/todos"));
```

`typedFetch` lança `HttpError` (com o `Response` original) quando o status não é OK. Passe `fetcher` ou `parse` no segundo argumento para personalizar o comportamento em testes ou APIs não JSON.

## TypeScript

```ts
/// <reference types="@ailuracode/alpinejs-query/global" />
```

## Veja também

- [Core](./core.md)
- [Documentação do TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
