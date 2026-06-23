# @ailuracode/alpine-query-devtools

Browser devtools panel for inspecting `@ailuracode/alpine-query` cache entries, status flags, and mutations.

## Install

```bash
npm install @ailuracode/alpine-query-devtools @ailuracode/alpine-query alpinejs
```

```js
import query from "@ailuracode/alpine-query";
import queryDevtools from "@ailuracode/alpine-query-devtools";

Alpine.plugin(query());
Alpine.plugin(queryDevtools());
Alpine.start();
```

See the [package README](../packages/query-devtools/README.md) for options and imperative mounting.

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
