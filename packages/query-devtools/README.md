# @ailuracode/alpine-query-devtools

TanStack Query-style devtools panel for [`@ailuracode/alpine-query`](../query/README.md). Inspect cached queries, live status flags, mutation history, and trigger cache actions while developing.

## Install

```bash
npm install @ailuracode/alpine-query-devtools @ailuracode/alpine-query alpinejs
```

## Setup

Register **after** the query plugin:

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import queryDevtools from "@ailuracode/alpine-query-devtools";

Alpine.plugin(query());
Alpine.plugin(queryDevtools({ initialOpen: false, position: "bottom" }));
Alpine.start();
```

A floating **Query** button appears in the bottom-right corner. Click it to open the panel.

## Features

- Live query list with `status`, `fetchStatus`, stale state, and observer count
- Query detail view with `data`, `error`, and resolved options
- Mutation history with variables and results
- Search filter by query key
- Actions: **Refetch**, **Invalidate**, **Remove**
- Tabs for **Queries** and **Mutations**

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `position` | `"bottom"` | `"bottom"` or `"right"` panel layout |
| `toggleCorner` | `"bottom-right"` | Toggle button corner |
| `persistToggleCorner` | `true` | Save toggle corner in `localStorage` |
| `toggleCornerStorageKey` | `"alpine-query-devtools:toggle-corner"` | Storage key for the corner |
| `initialOpen` | `false` | Open the panel on mount |
| `filter` | `""` | Initial search text |
| `storeName` | `"query"` | Alpine store name |

### Toggle corners

The floating **Query** button can sit in any corner:

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right`

Set the initial corner with `toggleCorner`. When `persistToggleCorner` is `true` (default), the chosen corner is saved to `localStorage` and restored on the next visit. You can also change it from the corner selector inside the devtools panel header.

## Imperative API

Works with both `$store.query` (via Alpine) and `createQueryClient()`:

```js
import { createQueryClient } from "@ailuracode/alpine-query";
import { mountQueryDevtools, getQueryStore } from "@ailuracode/alpine-query-devtools";

// Option A — Alpine store (after Alpine.plugin(query()))
const fromAlpine = mountQueryDevtools({
  store: getQueryStore(Alpine),
  position: "right",
});

// Option B — framework-agnostic client (no Alpine.store required)
const query = createQueryClient();
const fromClient = mountQueryDevtools({ store: getQueryStore(query) });

fromAlpine.open();
fromClient.destroy();
```

## Production

Tree-shake devtools out of production bundles:

```js
if (import.meta.env.DEV) {
  const { default: queryDevtools } = await import("@ailuracode/alpine-query-devtools");
  Alpine.plugin(queryDevtools());
}
```

## License

MIT
