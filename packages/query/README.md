# @ailuracode/alpine-query

Alpine.js async data layer inspired by [TanStack Query](https://tanstack.com/query). Cache remote data, refetch when stale, invalidate after mutations, and expose reactive query state in templates.

## Install

```bash
npm install @ailuracode/alpine-query alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";

Alpine.plugin(
  query({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
    },
  })
);

Alpine.start();
```

## Framework-agnostic client

Use `createQueryClient()` when you need the query cache outside Alpine.js (tests, SSR setup, or other frameworks). State is backed by [Nanostores](https://github.com/nanostores/nanostores); the Alpine plugin bridges it to `$store.query` for templates.

```js
import { createQueryClient } from "@ailuracode/alpine-query";

const query = createQueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000 },
  },
});

const todos = query.observe(["todos"], () => fetch("/api/todos").then((r) => r.json()));
await todos.refetch();
todos.destroy();
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

Do **not** spread the result of `observe()` (`{ ...$store.query.observe() }`) — boolean getters such as `isLoading` and `isSuccess` are defined on the query object and are lost when spread into a new object.

Call `destroy()` when the subscription is no longer needed (e.g. when switching pages) so unused cache entries can be garbage-collected.

### Imperative access

```js
const todos = $store.query.fetch(["todos"], fetchTodos);
await todos.refetch();
$store.query.setData(["todos"], (current) => [...current, newTodo]);
$store.query.invalidate(["todos"]);
```

## Mutations

```html
<div
  x-data="{
    createTodo: $store.query.mutate({
      mutationFn: (title) =>
        fetch('/api/todos', {
          method: 'POST',
          body: JSON.stringify({ title }),
        }).then((r) => r.json()),
      onSuccess: () => $store.query.invalidate(['todos']),
    }),
  }"
>
  <button
    type="button"
    @click="createTodo.mutate('Ship feature')"
    x-bind:disabled="createTodo.isPending"
  >
    Add todo
  </button>
</div>
```

## Query options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Skip fetching when `false` |
| `staleTime` | `0` | Time (ms) before data is considered stale |
| `gcTime` | `300000` | Time (ms) to keep unused cache entries |
| `refetchOnWindowFocus` | `true` | Refetch stale queries on focus |
| `refetchInterval` | `false` | Polling interval in ms |
| `retry` | `3` | Retry count (`false` disables) |
| `retryDelay` | exponential | Delay between retries |
| `initialData` | — | Seed cache before first fetch |
| `placeholderData` | — | Temporary data while loading |

## API

### `createQueryClient(options?)`

Framework-agnostic entry point. Returns the same method surface as `$store.query` without registering an Alpine store.

| Method | Description |
|--------|-------------|
| Same as `$store.query` below | See table — `observe`, `fetch`, `get`, `prefetch`, `invalidate`, `remove`, `setData`, `cancel`, `reset`, `mutate` |

Internal cache state is backed by Nanostores. The Alpine plugin bridges that cache into reactive template bindings.

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

### Query state

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| undefined` | Latest successful result |
| `error` | `Error \| null` | Last error |
| `status` | `'pending' \| 'error' \| 'success'` | Query status |
| `fetchStatus` | `'fetching' \| 'paused' \| 'idle'` | Fetch activity |
| `isLoading` | `boolean` | First fetch in progress |
| `isFetching` | `boolean` | Any fetch in progress |
| `isError` | `boolean` | Query failed |
| `isSuccess` | `boolean` | Query succeeded |
| `isStale` | `boolean` | Data is older than `staleTime` |
| `refetch()` | `Promise<void>` | Force a new fetch |

## TypeScript

```ts
/// <reference types="@ailuracode/alpine-query/global" />
```

## Devtools

Use [`@ailuracode/alpine-query-devtools`](../query-devtools/README.md) for a TanStack Query-style inspector panel during development.

```js
import queryDevtools from "@ailuracode/alpine-query-devtools";

Alpine.plugin(queryDevtools({ position: "bottom" }));
```

The query store also exposes a headless API:

```js
const unsubscribe = $store.query.devtools.subscribe(() => {
  console.log($store.query.devtools.getSnapshot());
});
```

## License

MIT
