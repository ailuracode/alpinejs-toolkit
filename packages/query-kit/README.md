# @ailuracode/alpine-query-kit

Query cache with Nanostores adapter — the recommended headless Alpine query stack.

Re-exports everything from `@ailuracode/alpine-query` (cache core) plus:

- **Nanostores adapter** — `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`
- **Directives** — `directivePlugin`, `magicPlugin`, `modelDirectivePlugin`

Query Devtools (styled development panel) ships from a separate subpath:
`@ailuracode/alpine-query-kit/devtools`.

**[Full documentation →](../../docs/plugins/query-kit.md)**

## Install

```bash
pnpm add @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Quick example

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

## License

MIT
