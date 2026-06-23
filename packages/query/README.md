# @ailuracode/alpine-query

Store-agnostic async data layer inspired by [TanStack Query](https://tanstack.com/query). Cache remote data, refetch when stale, invalidate after mutations.

The **cache engine** has no store dependency. Pick an adapter plugin for Alpine.js reactivity:

| Package | Store runtime | Alpine integration |
|---------|---------------|-------------------|
| [`@ailuracode/alpine-query-adapter-nanostores`](../query-adapter-nanostores/README.md) | Nanostores | **Recommended** — `@nanostores/alpine` (`x-nano`, `$nano`) |
| [`@ailuracode/alpine-query-adapter-alpine`](../query-adapter-alpine/README.md) | Native `Alpine.reactive` | Zero extra store deps |
| [`@ailuracode/alpine-query-adapter-zustand`](../query-adapter-zustand/README.md) | Zustand vanilla | Manual bridge (no official zustand-alpine) |

## Install (recommended)

```bash
npm install @ailuracode/alpine-query @ailuracode/alpine-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

## Setup (Alpine + Nanostores)

```js
import Alpine from "alpinejs";
import nanostoresQuery from "@ailuracode/alpine-query-adapter-nanostores";

Alpine.plugin(nanostoresQuery());
Alpine.start();
```

## Framework-agnostic client

```js
import { createQueryClient, vanillaQueryAdapter } from "@ailuracode/alpine-query";
import { nanostoresQueryAdapter } from "@ailuracode/alpine-query-adapter-nanostores";

// Default: zero-dependency vanilla adapter
const vanilla = createQueryClient();

// Recommended outside Alpine: Nanostores adapter
const query = createQueryClient({ adapter: nanostoresQueryAdapter });
```

## Custom Alpine plugin

```js
import { createQueryPlugin, vanillaQueryAdapter } from "@ailuracode/alpine-query";

Alpine.plugin(createQueryPlugin(vanillaQueryAdapter));
```

## Queries

Use `observe()` inside `x-data` for component-scoped subscriptions (similar to `useQuery`):

```html
<div
  x-data="{
    todos: $store.query.observe(['todos'], () => fetch('/api/todos').then((r) => r.json())),
  }"
>
  <p x-show="todos.isLoading">Loading…</p>
  <p x-show="todos.isError" x-text="todos.error?.message"></p>
  <ul x-show="todos.isSuccess">
    <template x-for="todo in todos.data" :key="todo.id">
      <li x-text="todo.title"></li>
    </template>
  </ul>
  <button type="button" @click="todos.refetch()">Refresh</button>
</div>
```

Do **not** spread the result of `observe()` — boolean getters such as `isLoading` and `isSuccess` are lost when spread.

Call `destroy()` when the subscription is no longer needed so unused cache entries can be garbage-collected.

## API

### Core exports

| Export | Description |
|--------|-------------|
| `createQueryClient()` | Store-agnostic client (`adapter` defaults to vanilla) |
| `createQueryPlugin(adapter)` | Register `$store.query` with any adapter |
| `createAlpineBridgedAdapter(Alpine, base)` | Bridge any adapter into Alpine.reactive |
| `QueryStateAdapter` | Pluggable adapter interface |
| `vanillaQueryAdapter` | Built-in zero-dep adapter |

See adapter plugin READMEs for Alpine setup with Nanostores, Zustand, or native Alpine.reactive.

### `$store.query`

| Method | Description |
|--------|-------------|
| `observe(key, queryFn, options?)` | Subscribe + fetch; returns reactive state with `destroy()` |
| `fetch(key, queryFn, options?)` | Fetch without lifecycle subscription |
| `get(key)` | Read cached query state |
| `prefetch(key, queryFn, options?)` | Warm cache in the background |
| `invalidate(key?)` | Mark stale and refetch active queries |
| `remove(key?)` | Drop cache entries |
| `setData(key, data \| updater)` | Update cached data |
| `cancel(key)` | Cancel in-flight fetch |
| `reset()` | Clear entire cache |
| `mutate(options)` | Create a mutation helper |

## TypeScript

```ts
/// <reference types="@ailuracode/alpine-query/global" />
```

## Devtools

Use [`@ailuracode/alpine-query-devtools`](../query-devtools/README.md).

## License

MIT
