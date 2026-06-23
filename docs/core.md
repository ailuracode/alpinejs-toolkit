# Core plugin system

`@ailuracode/alpine-core` is the lazy plugin registry for the monorepo. Individual packages remain independently installable; the core coordinates registration and on-demand initialization.

## Why a core?

Each `@ailuracode/alpine-*` package is a standalone Alpine.js plugin. The core adds:

- **Deferred initialization** — register plugins without running them at import time
- **Selective loading** — initialize only the plugins you need
- **Dynamic imports** — load plugin code on demand with `lazyPlugin()`
- **SSR safety** — no browser globals in the core; loaders run at init time

## Registration vs initialization

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineMagicPlugin,
  defineStorePlugin,
  initPlugins,
  registerPlugin,
} from "@ailuracode/alpine-core";
import share from "@ailuracode/alpine-share";
import theme from "@ailuracode/alpine-theme";

// Register (no side effects)
registerPlugin("share", defineMagicPlugin(["share"], share));
registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({ onChange: applyTheme }))
);

// Initialize before Alpine.start()
Alpine.plugin(createAlpinePlugin(["share", "theme"]));
Alpine.start();
```

For dynamic imports:

```js
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "share",
  lazyPlugin({
    kind: "magic",
    magics: ["share"],
    import: () => import("@ailuracode/alpine-share"),
  })
);

await initPlugins(Alpine, "share");
Alpine.start();
```

## Plugin kinds

| Kind | Registers | Example |
|------|-----------|---------|
| `magic` | `Alpine.magic()` | `$share`, `$calendar` |
| `store` | `Alpine.store()` | `$store.theme`, `$store.query` |
| `both` | magics and/or stores | `$wakelock`, `$idle` |

Use `defineMagicPlugin`, `defineStorePlugin`, or `defineHybridPlugin` to build definitions with strict typing.

## Factory plugins

Plugins such as `theme` and `query` are factories that return an Alpine callback. Resolve the factory **before** registering:

```js
registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({ onChange: applyTheme }))
);
```

The core does not manage plugin options — only when the resolved callback runs.

## Tree shaking

The core does not import plugin packages. You import only the plugins you use and register them explicitly. Unused packages never enter the bundle.

## TypeScript

Reference the core types in your app:

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
```

Continue referencing individual plugin `global.d.ts` files for `$store.*` and `$magic` augmentations.

## API summary

| Function | Purpose |
|----------|---------|
| `registerPlugin(name, definition)` | Add a plugin to the registry |
| `initPlugins(Alpine, names?)` | Initialize plugins (supports async loaders) |
| `initPluginsSync(Alpine, names?)` | Initialize sync plugins only |
| `createAlpinePlugin(names?)` | Bridge into `Alpine.plugin()` |
| `lazyPlugin(options)` | Build a dynamic-import definition |
| `isPluginInitialized(name)` | Check init state |
| `getRegisteredPlugins()` | Inspect the registry |
