# @ailuracode/alpine-query

TanStack Query-style async data fetching for Alpine.js: caching, stale-while-revalidate, invalidation, retries, polling, and mutations.

## Install

```bash
npm install @ailuracode/alpine-query alpinejs
```

## Quick start

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";

Alpine.plugin(query());
Alpine.start();
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

- **`observe()`** — for `x-data`. Subscribes to the cache entry and unsubscribes via Alpine's `destroy()` lifecycle.
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
