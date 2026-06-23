# @ailuracode/alpine-query-adapter-alpine

Native [`Alpine.reactive`](https://alpinejs.dev) adapter plugin for [`@ailuracode/alpine-query`](../query/README.md).

No external store library. Best when you want the smallest dependency footprint and already rely on Alpine's built-in reactivity.

## Install

```bash
npm install @ailuracode/alpine-query @ailuracode/alpine-query-adapter-alpine alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import alpineStoreQuery from "@ailuracode/alpine-query-adapter-alpine";

Alpine.plugin(alpineStoreQuery());
Alpine.start();
```

## Imperative adapter

```js
import { createQueryClient, createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
// createAlpineStoreAdapter(Alpine) is exported from this package
```

## Integration note

There is no separate `@alpinejs/store` package — this adapter uses Alpine's native reactive objects directly.

## License

MIT
