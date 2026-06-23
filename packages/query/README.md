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
import query from "@ailuracode/alpine-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpine-query-adapter-nanostores";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.start();
```

Pass the adapter to `query()`, then it registers `$store.query`.

## Framework-agnostic client

```js
import { createQueryClient, vanillaQueryAdapter } from "@ailuracode/alpine-query";
import { nanostoresQueryAdapter } from "@ailuracode/alpine-query-adapter-nanostores";

// Default: zero-dependency vanilla adapter
const vanilla = createQueryClient();

// Recommended outside Alpine: Nanostores adapter
const query = createQueryClient({ adapter: nanostoresQueryAdapter });
```

## Custom adapter

Implement **`QueryStateAdapter`** to connect any reactive store to the query cache. The engine calls your adapter whenever a query or mutation entry is created; you own how that state is stored and how updates propagate.

Set **`name`** to a short human-readable label — query devtools show it in the panel title (`Alpine Query · Nanostores`).

### Interface

```ts
import type {
  MutationStateHandle,
  QueryStateAdapter,
  QueryStateHandle,
} from "@ailuracode/alpine-query";

// createQueryState → QueryStateHandle
//   name     — display label for devtools (required)
//   get()    — snapshot: { data, error, status, fetchStatus, dataUpdatedAt, errorUpdatedAt }
//   patch()  — apply partial updates from the cache engine
//   listen() — subscribe to record changes; return unsubscribe
//   state    — reactive QueryState<TData> (getters + refetch + isLoading, isSuccess, …)

// createMutationState → MutationStateHandle
//   same shape, record fields: { data, error, status }
//   state includes mutate / reset plus isPending, isSuccess, …
```

### Helpers exported by the core

| Export | Use when |
|--------|----------|
| `createQueryStateView(getRecord, staleTime, refetch)` | Build `QueryState` getters + flags from a plain record |
| `createMutationStateView(getRecord, handlers)` | Build `MutationState` getters + flags from a plain record |
| `attachQueryFlags(state, staleTime)` | Attach boolean getters to an existing reactive query object |
| `attachMutationFlags(state)` | Attach boolean getters to an existing reactive mutation object |
| `createAlpineBridgedAdapter(Alpine, base)` | Sync any store-backed adapter into `Alpine.reactive` |
| `vanillaQueryAdapter` | Reference implementation (zero dependencies) |

### Store-backed adapter (sketch)

```js
import {
  createMutationStateView,
  createQueryStateView,
  type QueryStateAdapter,
} from "@ailuracode/alpine-query";

export const myStoreAdapter: QueryStateAdapter = {
  name: "My Store",

  createQueryState(initial, staleTime, refetch) {
    const record = { ...initial };
    const state = createQueryStateView(() => record, staleTime, refetch);
    const listeners = new Set();

    return {
      state,
      get: () => record,
      patch: (patch) => {
        Object.assign(record, patch);
        for (const listener of listeners) listener(record);
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
        for (const listener of listeners) listener(record);
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

Replace the manual `Set` with your store's `subscribe` / `listen` API when available. See [`query-adapter-zustand`](../query-adapter-zustand/src/adapter.ts) and [`query-adapter-nanostores`](../query-adapter-nanostores/src/adapter.ts).

### Register as an Alpine plugin

```js
import query, { createAlpineBridgedAdapter } from "@ailuracode/alpine-query";
import { myStoreAdapter } from "./my-store-adapter.js";

Alpine.plugin(
  query({ adapter: (Alpine) => createAlpineBridgedAdapter(Alpine, myStoreAdapter) })
);

// Or pass the adapter directly if it already uses Alpine.reactive
Alpine.plugin(query({ adapter: myAlpineNativeAdapter }));
```

### Headless usage

```js
import { createQueryClient } from "@ailuracode/alpine-query";
import { myStoreAdapter } from "./my-store-adapter.js";

const query = createQueryClient({ adapter: myStoreAdapter });
const todos = query.observe(["todos"], fetchTodos);
```

### Reference implementations

| Adapter | File |
|---------|------|
| Vanilla (minimal) | [`src/adapters/vanilla.ts`](./src/adapters/vanilla.ts) |
| Alpine.reactive | [`query-adapter-alpine`](../query-adapter-alpine/src/adapter.ts) |
| Nanostores | [`query-adapter-nanostores`](../query-adapter-nanostores/src/adapter.ts) |
| Zustand | [`query-adapter-zustand`](../query-adapter-zustand/src/adapter.ts) |

Full guide: [docs/query.md — Custom adapter](../docs/query.md#custom-adapter).

## Custom Alpine plugin (quick)

```js
import query, { vanillaQueryAdapter } from "@ailuracode/alpine-query";

Alpine.plugin(query({ adapter: vanillaQueryAdapter }));
```

## Queries

Use `observe()` inside `x-data` for component-scoped subscriptions (similar to `useQuery`):

```html
<div
  x-data="{
    todos: $store.query.observe(['todos'], () => typedFetch('/api/todos')),
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

Import `typedFetch` and pass an explicit generic when you want stronger inference:

```js
import { typedFetch } from "@ailuracode/alpine-query";

/** @type {() => Promise<{ id: number; title: string }[]>} */
const fetchTodos = () => typedFetch("/api/todos");
```

Call `destroy()` when the subscription is no longer needed so unused cache entries can be garbage-collected.

## API

### Core exports

| Export | Description |
|--------|-------------|
| `query({ adapter })` | **Alpine plugin** — pass adapter, registers `$store.query` |
| `createQueryClient()` | Store-agnostic client (`adapter` defaults to vanilla) |
| `createQueryPlugin(adapter)` | Lower-level registration (prefer `query({ adapter })`) |
| `createAlpineBridgedAdapter(Alpine, base)` | Bridge any adapter into Alpine.reactive |
| `QueryStateAdapter` | Pluggable adapter interface |
| `vanillaQueryAdapter` | Built-in zero-dep adapter |
| `typedFetch<T>(input, init?)` | Typed JSON `fetch` helper for `queryFn` callbacks |
| `HttpError` | Thrown when `typedFetch` receives a non-OK response |

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
