# @ailuracode/alpine-query-adapter-zustand

[Zustand](https://github.com/pmndrs/zustand) vanilla store adapter plugin for [`@ailuracode/alpine-query`](../query/README.md).

There is **no official zustand-alpine integration**. This plugin uses Zustand's vanilla `createStore` API and bridges subscriptions into `Alpine.reactive` via `@ailuracode/alpine-query`'s bridge helper.

## Install

```bash
npm install @ailuracode/alpine-query @ailuracode/alpine-query-adapter-zustand alpinejs zustand
```

## Setup

```js
import Alpine from "alpinejs";
import zustandQuery from "@ailuracode/alpine-query-adapter-zustand";

Alpine.plugin(zustandQuery());
Alpine.start();
```

## Exports

| Export | Description |
|--------|-------------|
| `default` | Alpine plugin — registers `$store.query` |
| `zustandQueryAdapter` | Adapter for `createQueryClient({ adapter })` |
| `createAlpineZustandAdapter` | Zustand + Alpine.reactive bridge |

## Integration note

Zustand third-party adapters exist for React, Lit, and Angular — but not Alpine.js. This package provides a minimal bridge: `store.subscribe()` → `Alpine.reactive` property sync.

## License

MIT
