---
title: "Query kit"
description: "Package: @ailuracode/alpine-query-kit"
---

Package: `@ailuracode/alpine-query-kit`

Recommended Alpine query stack: store-agnostic cache core, Nanostores adapter, and `@nanostores/alpine`. The main entry is **headless**; Query Devtools ships from `@ailuracode/alpine-query-kit/devtools`.

## Includes

| Module | Import | Description |
|--------|--------|-------------|
| Query cache | `@ailuracode/alpine-query-kit` | Re-exports `@ailuracode/alpine-query` (`$store.query`, `queryKey`, …) |
| Nanostores adapter | `@ailuracode/alpine-query-kit` | `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`, `NanoStores` |
| Devtools | `@ailuracode/alpine-query-kit/devtools` | Styled inspector panel (development-only) |

For Alpine/Zustand-only setups without Nanostores, use [`@ailuracode/alpine-query`](../query.md) with [`query-adapter-alpine`](../query.md) or [`query-adapter-zustand`](../query.md).

## Install

```bash
pnpm add @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Setup

```js
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

Registers `$store.query` and `@nanostores/alpine` (`x-nano`, `$nano`). Devtools are **not** included — import them separately when needed.

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

Import from the devtools subpath so production bundles omit styled UI:

```js
import queryKit from "@ailuracode/alpine-query-kit";
import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKit());
Alpine.plugin(
  queryDevtoolsPlugin({
    position: "bottom",
    toggleCorner: "bottom-left",
    theme: "system", // host `data-theme`, `.dark`, or prefers-color-scheme
    storeName: "query",
  })
);
```

Combined registration:

```js
import { queryKitWithDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKitWithDevtoolsPlugin({ devtools: { theme: "dark" } }));
```

Lazy-load in development:

```js
if (import.meta.env.DEV) {
  const { queryDevtoolsPlugin } = await import("@ailuracode/alpine-query-kit/devtools");
  Alpine.plugin(queryDevtoolsPlugin());
}
```

### Theme behavior

| `theme` option | Behavior |
|----------------|----------|
| `"light"` | Force light devtools chrome |
| `"dark"` | Force dark devtools chrome |
| `"system"` (default) | Follow host `data-theme` on `<html>`, then `.dark` on `<html>`, then `prefers-color-scheme` |

In `system` mode the panel watches `data-theme` / `class` on the document root and reacts to color-scheme media changes.

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
| `theme` | `"system"` | Panel color theme |
| `storeName` | `"query"` | Alpine store name to inspect |
| `additionalStores` | — | Extra query stores to merge in the panel |

## Exports

Headless APIs (main entry):

```js
import queryKit, {
  queryKey,
  nanostoresQueryAdapter,
  createAlpineNanostoresAdapter,
  nanostoresQueryPlugin,
} from "@ailuracode/alpine-query-kit";
```

Devtools APIs (subpath):

```js
import {
  queryDevtoolsPlugin,
  queryKitWithDevtoolsPlugin,
  mountQueryDevtools,
} from "@ailuracode/alpine-query-kit/devtools";
```

See [Query cache](../query.md) for fetch options, mutations, and adapter authoring.
