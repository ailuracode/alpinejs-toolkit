# @ailuracode/alpine-core

Lazy plugin registry and initializer for [Alpine.js](https://alpinejs.dev/) v3.

Use this package to register plugins without running them at import time, then initialize only the plugins you need — keeping bundles tree-shakeable and SSR-safe.

## Install

```bash
npm install @ailuracode/alpine-core alpinejs
```

## Quick start

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineMagicPlugin,
  defineStorePlugin,
  initPlugins,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { sharePlugin } from "@ailuracode/alpine-transfer";
import theme from "@ailuracode/alpine-theme";

registerPlugin(
  "share",
  defineMagicPlugin(["share"], sharePlugin)
);

registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({
    onChange({ resolved }) {
      document.documentElement.dataset.theme = resolved;
    },
  }))
);

// Sync entry (factory plugins must be resolved before registerPlugin)
Alpine.plugin(createAlpinePlugin(["share", "theme"]));
Alpine.start();
```

## Lazy dynamic imports

```js
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "share",
  lazyPlugin({
    kind: "magic",
    magics: ["share"],
    import: () => import("@ailuracode/alpine-transfer"),
  })
);

await initPlugins(Alpine, "share");
Alpine.start();
```

## API

| Export | Description |
|--------|-------------|
| `registerPlugin(name, definition)` | Register a plugin without initializing it |
| `initPlugins(Alpine, names?)` | Initialize all or selected plugins (async-safe) |
| `initPluginsSync(Alpine, names?)` | Initialize sync plugins only |
| `createAlpinePlugin(names?)` | Alpine.js bridge for sync plugins |
| `defineMagicPlugin(magics, loader)` | Helper for magic plugins |
| `defineStorePlugin(stores, loader)` | Helper for store plugins |
| `defineHybridPlugin(options)` | Helper for plugins that register both |
| `lazyPlugin(options)` | Helper for dynamic `import()` loaders |
| `isPluginInitialized(name)` | Whether a plugin has been initialized |
| `getRegisteredPlugins()` | List registered plugins |
| `createMatchMediaWatcher(query, callback)` | Subscribe to `matchMedia` with legacy fallback |
| `watchMatchMedia(queries, callback)` | Subscribe to multiple queries |
| `safeMatchMedia(query)` | SSR-safe `window.matchMedia` |
| `readTouchCapabilities()` | Shared touch/pointer/hover signals |

## Plugin kinds

- **magic** — registers Alpine magics such as `$share` or `$calendar`
- **store** — registers Alpine stores such as `$store.theme`
- **both** — registers multiple magics and/or stores in one plugin (e.g. `$wakelock`, `$idle`)

## SSR

The core never touches `window` or `navigator` at import time. Plugin loaders run only when you call `initPlugins()` or `createAlpinePlugin()`.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
```

Also reference individual plugin `global.d.ts` files for magic and store typings.

## License

MIT
