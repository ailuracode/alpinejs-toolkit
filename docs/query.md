# @ailuracode/alpine-query

TanStack Query-style async data fetching for Alpine.js: caching, stale-while-revalidate, invalidation, retries, polling, and mutations.

## Install

```bash
npm install @ailuracode/alpine-query @ailuracode/alpine-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

## Quick start

Pick an adapter plugin for Alpine. **Nanostores** is recommended (`@nanostores/alpine` provides `x-nano` and `$nano`):

```js
import Alpine from "alpinejs";
import nanostoresQuery from "@ailuracode/alpine-query-adapter-nanostores";

Alpine.plugin(nanostoresQuery());
Alpine.start();
```

Other adapter packages:

| Package | Backend |
|---------|---------|
| `@ailuracode/alpine-query-adapter-nanostores` | Nanostores + `@nanostores/alpine` (**recommended**) |
| `@ailuracode/alpine-query-adapter-alpine` | Native `Alpine.reactive` |
| `@ailuracode/alpine-query-adapter-zustand` | Zustand vanilla (manual bridge; no official zustand-alpine) |

### Without Alpine

`createQueryClient()` exposes the same API without registering `$store.query`. The cache core is **store-agnostic** — pass any `QueryStateAdapter` or use the vanilla default.

```js
import { createQueryClient, vanillaQueryAdapter } from "@ailuracode/alpine-query";
import { nanostoresQueryAdapter } from "@ailuracode/alpine-query-adapter-nanostores";

const query = createQueryClient({ adapter: nanostoresQueryAdapter });
const todos = query.observe(["todos"], fetchTodos);
```

```html
<div
  x-data="{
    todos: $store.query.observe(['todos'], () => fetch('/api/todos').then((r) => r.json())),
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

Keep the query object nested (e.g. `todos.isLoading`) — do not spread `observe()` into `x-data`, or getters like `isSuccess` will not work.

### Pagination

Use the page number in the query key so each page is cached independently:

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
          fetch(
            `https://pokeapi.co/api/v2/pokemon?limit=${this.pageSize}&offset=${(page - 1) * this.pageSize}`
          ).then((r) => r.json()),
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

Navigating back to a previous page serves cached data instantly while `staleTime` has not expired.

See the [package README](../packages/query/README.md) for the full API.

## Concepts

### Query keys

Arrays identify cached entries. Use stable, serializable values:

```js
['todos']
['todos', todoId]
['users', userId, 'posts']
```

### `observe()` vs `fetch()`

- **`observe()`** — for `x-data`. Subscribes to the cache entry; call `destroy()` when the subscription is no longer needed (e.g. pagination) so entries can be garbage-collected.
- **`fetch()`** — imperative fetch without holding a subscription.

### Stale time and garbage collection

- **`staleTime`** — how long cached data is treated as fresh.
- **`gcTime`** — how long unused entries stay in memory after all observers disconnect.

### Mutations

`$store.query.mutate()` returns a reactive mutation object with `mutate()`, `reset()`, and status getters (`isPending`, `isSuccess`, …). Use `invalidate()` in `onSuccess` to refresh related queries.

## TypeScript

```ts
/// <reference types="@ailuracode/alpine-query/global" />
```

## See also

- [Architecture](./architecture.md)
- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
