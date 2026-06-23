# @ailuracode/alpine-query-adapter-nanostores

**Recommended** [Nanostores](https://github.com/nanostores/nanostores) adapter plugin for [`@ailuracode/alpine-query`](../query/README.md).

Registers [`@nanostores/alpine`](https://github.com/nanostores/alpine) by default (`x-nano`, `$nano`) and bridges Nanostores `map()` stores into Alpine templates.

## Install

```bash
npm install @ailuracode/alpine-query @ailuracode/alpine-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

## Setup

```js
import Alpine from "alpinejs";
import nanostoresQuery from "@ailuracode/alpine-query-adapter-nanostores";

Alpine.plugin(nanostoresQuery());
Alpine.start();
```

Disable automatic `@nanostores/alpine` registration if you already load it:

```js
Alpine.plugin(nanostoresQuery({ registerNanoStores: false }));
```

## Exports

| Export | Description |
|--------|-------------|
| `default` | Alpine plugin — registers `$store.query` |
| `nanostoresQueryAdapter` | Adapter for `createQueryClient({ adapter })` |
| `createAlpineNanostoresAdapter` | Nanostores + Alpine.reactive bridge |
| `NanoStores`, `directivePlugin`, `magicPlugin` | Re-exported from `@nanostores/alpine` |

## Alpine integration

Uses the official `@nanostores/alpine` integration (`x-nano`, `$nano`, `withStores`).

## License

MIT
