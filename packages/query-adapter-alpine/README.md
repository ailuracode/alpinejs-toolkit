# @ailuracode/alpinejs-query-adapter-alpine

Native [`Alpine.reactive`](https://alpinejs.dev) adapter for [`@ailuracode/alpinejs-query`](../query/README.md).

No external store library. Best when you want the smallest dependency footprint.

## Install

```bash
npm install @ailuracode/alpinejs-query @ailuracode/alpinejs-query-adapter-alpine alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpinejs-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpinejs-query-adapter-alpine";

Alpine.plugin(query({ adapter: createAlpineStoreAdapter }));
Alpine.start();
```

## Exports

| Export | Description |
|--------|-------------|
| `createAlpineStoreAdapter` | Factory for `query({ adapter })` |
| `alpineStoreQueryAdapter` | Alias of `createAlpineStoreAdapter` |
| `default` | Convenience plugin wrapping `query({ adapter })` |

## Integration note

There is no separate `@alpinejs/store` package — this adapter uses Alpine's native reactive objects directly.

## License

MIT
