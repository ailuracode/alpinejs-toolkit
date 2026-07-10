# @ailuracode/alpine-query-kit

Query cache with Nanostores adapter and devtools panel — the recommended Alpine query stack.

Re-exports everything from `@ailuracode/alpine-query` (cache core) plus:

- **Nanostores adapter** — `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`
- **Devtools panel** — `queryDevtoolsPlugin`, `mountQueryDevtools`, `getQueryStore`
- **Directives** — `directivePlugin`, `magicPlugin`, `modelDirectivePlugin`

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

## Without devtools

```ts
Alpine.plugin(queryKit({ devtools: false }));
```

## Standalone usage (no Alpine)

```ts
import { createAlpineNanostoresAdapter, nanostoresQueryAdapter } from "@ailuracode/alpine-query-kit";

// Use the nanostores adapter with a custom query client
import { createQueryClient, query } from "@ailuracode/alpine-query";

const client = createQueryClient({ adapter: nanostoresQueryAdapter });
```

## Devtools

The devtools panel renders a floating UI for inspecting active queries and mutations.

```ts
Alpine.plugin(
  queryKit({
    devtools: {
      position: "bottom-right",  // "bottom" | "right"
      theme: "system",           // "light" | "dark" | "system"
    },
  })
);
```

### Devtools API

| Export | Description |
|--------|-------------|
| `queryDevtoolsPlugin` | Plugin factory for devtools only (no query cache) |
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
