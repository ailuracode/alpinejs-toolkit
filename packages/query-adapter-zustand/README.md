# @ailuracode/alpinejs-query-adapter-zustand

[Zustand](https://github.com/pmndrs/zustand) vanilla store adapter for [`@ailuracode/alpinejs-query`](../query/README.md).

There is **no official zustand-alpine integration**. This package uses Zustand's vanilla `createStore` API and bridges subscriptions into `Alpine.reactive`.

## Install

```bash
npm install @ailuracode/alpinejs-query @ailuracode/alpinejs-query-adapter-zustand alpinejs zustand
```

## Setup

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpinejs-query";
import { createAlpineZustandAdapter } from "@ailuracode/alpinejs-query-adapter-zustand";

Alpine.plugin(query({ adapter: createAlpineZustandAdapter }));
Alpine.start();
```

## Exports

| Export | Description |
|--------|-------------|
| `zustandQueryAdapter` | Adapter for `createQueryClient({ adapter })` |
| `createAlpineZustandAdapter` | Factory for `query({ adapter })` |
| `default` | Convenience plugin wrapping `query({ adapter })` |

## Integration note

Zustand third-party adapters exist for React, Lit, and Angular — but not Alpine.js. This package bridges `store.subscribe()` → `Alpine.reactive`.

## License

MIT
