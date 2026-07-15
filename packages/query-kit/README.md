# @ailuracode/alpine-query-kit

Query cache with Nanostores adapter — the recommended headless Alpine query stack.

Re-exports everything from `@ailuracode/alpine-query` (cache core) plus:

- **Nanostores adapter** — `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`
- **Directives** — `directivePlugin`, `magicPlugin`, `modelDirectivePlugin`

Query Devtools (styled development panel) ships from a separate subpath:
`@ailuracode/alpine-query-kit/devtools`.

## Install

```bash
pnpm add @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Quick start

```ts
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

## Devtools (development)

Import devtools from the dedicated subpath so production bundles stay headless:

```ts
import queryKit from "@ailuracode/alpine-query-kit";
import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKit());
Alpine.plugin(
  queryDevtoolsPlugin({
    position: "bottom",
    toggleCorner: "bottom-right",
    theme: "system", // follows host `data-theme`, `.dark`, or system preference
  })
);
```

Or register both in one plugin:

```ts
import { queryKitWithDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKitWithDevtoolsPlugin({ devtools: { theme: "dark" } }));
```

## Standalone usage (no Alpine)

```ts
import { createAlpineNanostoresAdapter, nanostoresQueryAdapter } from "@ailuracode/alpine-query-kit";

// Use the nanostores adapter with a custom query client
import { createQueryClient, query } from "@ailuracode/alpine-query";

const client = createQueryClient({ adapter: nanostoresQueryAdapter });
```

## Devtools API (`/devtools` subpath)

| Export | Description |
|--------|-------------|
| `queryDevtoolsPlugin` | Plugin factory for devtools only |
| `queryKitWithDevtoolsPlugin` | Registers Nanostores adapter + devtools panel |
| `mountQueryDevtools(options)` | Mount the devtools panel programmatically |
| `getQueryStore()` | Access the merged query store snapshot |
| `DEFAULT_PREFERENCES_STORAGE_KEY` | Storage key for panel preferences |
| `TOGGLE_CORNERS` | Available panel corner positions |
| `DEFAULT_TOGGLE_CORNER` | Default corner (`"bottom-right"`) |

## Re-exports from `@ailuracode/alpine-query`

Everything from the core package is re-exported:

| Export | Description |
|--------|-------------|
| `createQueryClient` | Create a query client with an adapter |
| `query` | Headless query factory |
| `vanillaQueryAdapter` | Vanilla JS adapter (no reactivity) |
| `QueryStore` | Query store for devtools integration |

## Includes

| Module | Import | Description |
|--------|--------|-------------|
| Query cache | `@ailuracode/alpine-query-kit` | Re-exports `@ailuracode/alpine-query` (`$store.query`, `queryKey`, …) |
| Nanostores adapter | `@ailuracode/alpine-query-kit` | `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`, `NanoStores` |
| Devtools | `@ailuracode/alpine-query-kit/devtools` | Styled inspector panel (development-only) |

For Alpine/Zustand-only setups without Nanostores, use [`@ailuracode/alpine-query`](../query/README.md) with [`query-adapter-alpine`](../query-adapter-alpine/README.md) or [`query-adapter-zustand`](../query-adapter-zustand/README.md).

## Registration details

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

See [Query cache](../query/README.md) for fetch options, mutations, and adapter authoring.

## License

MIT
