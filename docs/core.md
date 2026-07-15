---
title: "Core"
description: "Lazy plugin registry for the Alpine toolkit — deferred init, dynamic imports, and framework-agnostic entrypoints."
---

`@ailuracode/alpine-core` is the **lazy plugin registry** at the center of the toolkit. Individual packages remain independently installable; the core coordinates registration and on-demand initialization — ideal for app entries that should not load every plugin up front.

## Why a core?

Each `@ailuracode/alpine-*` package is a standalone Alpine.js plugin. The core adds:

- **Deferred initialization** — register plugins without running them at import time
- **Selective loading** — initialize only the plugins you need
- **Dynamic imports** — load plugin code on demand with `lazyPlugin()`
- **SSR safety** — no browser globals in the core; loaders run at init time

## Registration vs initialization

```ts
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  initPlugins,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], { names: ["theme"], plugin: () => themePlugin() })
);

// Initialize before Alpine.start()
Alpine.plugin(createAlpinePlugin(["theme"]));
Alpine.start();
```

For dynamic imports:

```ts
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "share",
  lazyPlugin(["magic"], {
    names: ["share"],
    import: () => import("@ailuracode/alpine-transfer"),
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
| `directive` | `Alpine.directive()` | `x-child` |

Use `definePlugin(kinds, options)` to build definitions with strict typing. A single plugin can register any combination of the three by passing a list of kinds; when more than one kind is declared, `names` becomes an object keyed by kind:

```ts
definePlugin(["magic", "store"], {
  names: { magic: ["wakelock"], store: ["idle"] },
  plugin: cb,
});
```

Pass `{ allowNameCrossKind: true }` to allow the same name under multiple kinds of one plugin.

## Factory plugins

Plugins such as `theme` and `query` are factories that return an Alpine callback. Resolve the factory **before** registering:

```ts
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], { names: ["theme"], plugin: () => themePlugin() })
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
/// <reference types="@ailuracode/alpine-core/global" />
```

The `./global` subpath re-exports the named-export surface of `@types/alpinejs` so consumers that augment `Alpine.*` do not have to add a second triple-slash directive. Per the toolkit convention, this package does NOT augment external modules — consumers type the Alpine runtime with the `Alpine<Stores>` generic from `@ailuracode/alpine-core` directly.

## API summary

| Function | Purpose |
|----------|---------|
| `registerPlugin(name, definition)` | Add a plugin to the registry |
| `unregisterPlugin(name)` | Remove a plugin from the registry |
| `initPlugins(Alpine, names?)` | Initialize plugins (supports async loaders) |
| `initPluginsSync(Alpine, names?)` | Initialize sync plugins only |
| `createAlpinePlugin(names?)` | Bridge into `Alpine.plugin()` |
| `definePlugin(kinds, options)` | Build a typed plugin definition |
| `lazyPlugin(kinds, options)` | Build a dynamic-import definition |
| `isPluginInitialized(name)` | Check init state |
| `markPluginInitialized(name)` | Mark a plugin as initialized |
| `getRegisteredPlugins()` | Inspect the registry |
| `getRegisteredPlugin(name)` | Look up one plugin |
| `resolvePluginEntries(names?)` | Resolve names to registry entries |
| `resetPluginRegistry()` | Clear the registry (tests / storybook) |
| `setRegistryDebugSink(sink)` | Forward registry events to a `DebugLogger` |
| `getRegistryDebugSink()` | Retrieve the configured debug sink |

## Controller primitives

| Export | Purpose |
|--------|---------|
| `BaseController<EventMap>` | Abstract base for every headless controller |
| `EventEmitter<EventMap>` | Strongly-typed `on` / `once` / `off` / `emit` bus |
| `CleanupStack` | LIFO stack of cleanup callbacks with idempotent `dispose()` |
| `InstanceRegistry<T>` | Map of controller instances keyed by string ID |
| `ToolkitError` | Base error with stable `code` and optional `cause` |
| `Alpine<Stores>` | Typed view of `Alpine` whose `store()` overloads narrow to `Stores` |
| `PluginCallback<T>` | Generic `Alpine.plugin()` callback typed against an `Alpine` view |

## Avoiding name collisions

Alpine 3 silently overwrites whatever a previous plugin registered under the same key — convenient in development, dangerous the day two plugins race for `$store.theme`. `@ailuracode/alpine-core` ships a thin guard layer so every feature plugin refuses a collision the same way:

```ts
import { guardStore } from "@ailuracode/alpine-core";

guardStore(Alpine, "theme", themeStore, "alpine-theme");
// → registers $store.theme, or throws
//   RegistrationError("REGISTRATION_COLLISION") if the key is already taken.
```

The error message names the factory that owns the guard and points at the configuration knob that fixes the collision — usually `storeKey` / `magicKey` exposed by the feature plugin:

```ts
Alpine.plugin(themePlugin({ storeKey: "appearance" })); // → $store.appearance
```

| Export | Purpose |
|--------|---------|
| `guardStore(Alpine, name, value, packageName, options?)` | Register `Alpine.store` and throw on collision |
| `guardMagic(Alpine, name, accessor, packageName, options?)` | Register `Alpine.magic` with internal tracking |
| `guardDirective(Alpine, name, directive, packageName, options?)` | Register `Alpine.directive` with internal tracking |
| `RegistrationError` | `ToolkitError` subclass (`code: "REGISTRATION_COLLISION"`) |
| `resetRegistrationTracking()` | Clear internal tracking sets (used by the global test setup) |

Guarded plugins carry the `packageName` they registered in the error, so a host sees `themePlugin()` instead of just the raw key. The `architecture:check` script enforces that no feature package outside `packages/core/src/registration.ts` calls `Alpine.store` / `Alpine.magic` / `Alpine.directive` directly; pending migrations are tracked in `architecture-check-policy.mjs#registrationGuardPending`.

