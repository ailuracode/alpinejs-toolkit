# @ailuracode/alpine-query-adapter-alpine

Native [`Alpine.reactive`](https://alpinejs.dev) adapter for [`@ailuracode/alpine-query`](../query/README.md).

No external store library. Best when you want the smallest dependency footprint.

## Install

```bash
pnpm add @ailuracode/alpine-query @ailuracode/alpine-query-adapter-alpine alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";

Alpine.plugin(query({ adapter: createAlpineStoreAdapter }));
Alpine.start();
```

### Avoiding name collisions

If your application already owns a `$store.query` — or another toolkit plugin registers on that name — rename the integration surface without touching the query cache:

```ts
Alpine.plugin(query({ adapter: createAlpineStoreAdapter, storeKey: "cache" })); // → $store.cache
```

The exposed constant `DEFAULT_QUERY_STORE_KEY` keeps the rename discoverable from TypeScript.

## Exports

| Export | Description |
|--------|-------------|
| `createAlpineStoreAdapter` | Factory for `query({ adapter })` |
| `alpineStoreQueryAdapter` | Alias of `createAlpineStoreAdapter` |
| `default` | Convenience plugin wrapping `query({ adapter })` |
| `DEFAULT_QUERY_STORE_KEY` | Default `$store.query` key |
| `CreateQueryPluginOptions` | Options accepted by `createQueryPlugin` |
| `QueryRegisterOptions` | Options accepted by `query({...})` |

## Integration note

There is no separate `@alpinejs/store` package — this adapter uses Alpine's native reactive objects directly.

## License

MIT
