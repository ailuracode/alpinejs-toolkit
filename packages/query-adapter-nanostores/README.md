# @ailuracode/alpinejs-query-adapter-nanostores

**Recommended** [Nanostores](https://github.com/nanostores/nanostores) adapter for [`@ailuracode/alpinejs-query`](../query/README.md).

Provides `nanostoresQueryAdapter` and `createAlpineNanostoresAdapter`. Register with `query({ adapter })` from the core package.

## Install

```bash
npm install @ailuracode/alpinejs-query @ailuracode/alpinejs-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

## Setup

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpinejs-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpinejs-query-adapter-nanostores";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.start();
```

## Convenience plugin

This package also exports a default plugin that registers `@nanostores/alpine` and `$store.query` in one step:

```js
import nanostoresQuery from "@ailuracode/alpinejs-query-adapter-nanostores";

Alpine.plugin(nanostoresQuery());
```

## Exports

| Export | Description |
|--------|-------------|
| `nanostoresQueryAdapter` | Adapter for `createQueryClient({ adapter })` |
| `createAlpineNanostoresAdapter` | Factory for `query({ adapter })` |
| `default` | Convenience plugin (Nanostores + query) |
| `NanoStores`, `directivePlugin`, `magicPlugin` | Re-exported from `@nanostores/alpine` |

## Alpine integration

Uses the official `@nanostores/alpine` integration (`x-nano`, `$nano`, `withStores`).

## License

MIT
