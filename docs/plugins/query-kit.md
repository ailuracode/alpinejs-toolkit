---
title: "Query kit"
description: "Package: @ailuracode/alpine-query-kit"
---

Package: `@ailuracode/alpine-query-kit`

Recommended Alpine query stack: store-agnostic cache core, Nanostores adapter, `@nanostores/alpine`, and the devtools panel — in one package.

## Includes

| Module | Description |
|--------|-------------|
| Query cache | Re-exports `@ailuracode/alpine-query` (`$store.query`, `queryKey`, …) |
| Nanostores adapter | `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`, `NanoStores` |
| Devtools | Inspector panel for the query cache |

For Alpine/Zustand-only setups without Nanostores, use [`@ailuracode/alpine-query`](../query.md) with [`query-adapter-alpine`](../query.md) or [`query-adapter-zustand`](../query.md).

## Install

```bash
npm install @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Setup

```js
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

Registers `$store.query`, `@nanostores/alpine` (`x-nano`, `$nano`), and the devtools panel.

## Without devtools

```js
Alpine.plugin(queryKit({ devtools: false }));
```

## Nanostores adapter only

```js
import query, { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-kit";

Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
```

Or register `$nano` without the query store:

```js
import { NanoStores } from "@ailuracode/alpine-query-kit";

Alpine.plugin(NanoStores);
```

## Devtools

The devtools panel mounts after `alpine:initialized`. Configure position, toggle corner, and persistence:

```js
import queryKit, { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit";

// Included by default in queryKit()
Alpine.plugin(queryKit());

// Or register separately (e.g. with query core + another adapter)
Alpine.plugin(
  queryDevtoolsPlugin({
    position: "bottom",
    toggleCorner: "bottom-left",
    storeName: "query",
  })
);
```

Lazy-load in production:

```js
if (import.meta.env.DEV) {
  const { default: queryDevtools } = await import("@ailuracode/alpine-query-kit");
  Alpine.plugin(queryDevtools({ devtools: false }));
  Alpine.plugin((await import("@ailuracode/alpine-query-kit")).queryDevtoolsPlugin());
}
```

### Devtools options

| Option | Default | Description |
|--------|---------|-------------|
| `position` | `"bottom"` | Panel dock: `"bottom"` or `"right"` |
| `toggleCorner` | `"bottom-right"` | Floating toggle position |
| `persistToggleCorner` | `true` | Save toggle corner to `localStorage` |
| `persistPreferences` | `true` | Save panel preferences |
| `followLatest` | `true` | Auto-select newest query activity |
| `initialOpen` | `false` | Open panel on load |
| `filter` | `""` | Initial filter string |
| `storeName` | `"query"` | Alpine store name to inspect |
| `additionalStores` | — | Extra query stores to merge in the panel |

## Exports

All public APIs from the query cache, Nanostores adapter, and devtools are exported from this package:

```js
import queryKit, {
  queryKey,
  nanostoresQueryAdapter,
  createAlpineNanostoresAdapter,
  nanostoresQueryPlugin,
  queryDevtoolsPlugin,
  mountQueryDevtools,
} from "@ailuracode/alpine-query-kit";
```

See [Query cache](../query.md) for fetch options, mutations, and adapter authoring.
