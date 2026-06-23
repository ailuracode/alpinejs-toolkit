# @ailuracode/alpine-query-devtools

Browser devtools panel for inspecting `@ailuracode/alpine-query` cache entries, status flags, and mutations.

## Install

```bash
npm install @ailuracode/alpine-query-devtools @ailuracode/alpine-query @ailuracode/alpine-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpine-query-adapter-nanostores";

import queryDevtools from "@ailuracode/alpine-query-devtools";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.plugin(queryDevtools());
Alpine.start();
```

See the [package README](../packages/query-devtools/README.md) for options and imperative mounting.

## Compatibility

Devtools consume the headless `$store.query.devtools` API (`subscribe`, `getSnapshot`) and the store methods `get`, `invalidate`, and `remove`. They work with any query adapter plugin:

- **Alpine plugin** — register a query adapter plugin, then `queryDevtools()`; panel resolves `$store.query` on `alpine:initialized`.
- **`createQueryClient()`** — pass the client to `mountQueryDevtools({ store: getQueryStore(client) })` without Alpine.

## What you can inspect

- Query keys and serialized `data`
- `status`, `fetchStatus`, `isLoading`, `isFetching`, `isStale`, observer count
- Resolved query options (`staleTime`, `gcTime`, `retry`, …)
- Mutation variables, results, and errors
- Live updates via `$store.query.devtools.subscribe()`
- Toggle button corner (`top-left`, `top-right`, `bottom-left`, `bottom-right`) with `localStorage` persistence

## Production

Load devtools only in development:

```js
if (import.meta.env.DEV) {
  const { default: queryDevtools } = await import("@ailuracode/alpine-query-devtools");
  Alpine.plugin(queryDevtools());
}
```

## See also

- [@ailuracode/alpine-query](./query.md)
- [TanStack Query Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
