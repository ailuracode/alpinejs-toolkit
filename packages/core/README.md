# @ailuracode/alpine-core

Reusable infrastructure for the
[`@ailuracode/alpinejs-toolkit`](https://github.com/ailuracode/alpinejs-toolkit)
monorepo.

`@ailuracode/alpine-core` exposes two layers:

1. **Plugin registry + Alpine bridge** — register plugins at import time,
   initialize them on demand, support both sync and dynamic `import()`
   loaders, stay SSR-safe.
2. **Headless controller primitives** — `BaseController`,
   `TypedEventEmitter`, `CleanupStack`, `InstanceRegistry`, and
   `ToolkitError`. Every feature package in this monorepo is built on top of
   them.

This package MUST NOT become a container for feature-specific helpers —
[per `AGENTS.md`](../../AGENTS.md) every abstraction here is generic,
free of feature-specific behavior, and used (or going to be used) by at
least two packages.

## Why

| Problem                                                           | This package solves it by                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Plugins run side effects the moment they're imported              | `registerPlugin()` only stores the definition                                                  |
| Dynamic `import()` can't be awaited before `Alpine.start()`       | `initPlugins()` resolves every loader (sync or async) before the consumer's bootstrap          |
| Mixed sync/async code paths produce subtle init order bugs        | `initPluginsSync()` / `createAlpinePlugin()` enforce a single sync code path                   |
| `window.matchMedia` throws on the server                          | `safeMatchMedia()`, `isBrowser()`, `safeWindow()`, `safeDocument()` guard DOM access           |
| Every feature reinvents its own lifecycle, event bus, and cleanup | `BaseController` + `CleanupStack` + `TypedEventEmitter` + `InstanceRegistry` ship the contract |

> **What core is NOT.** Touch capability detection (`readTouchCapabilities`)
> used to live here; it has been removed because it is feature-specific and
> belongs in a future `@ailuracode/alpine-touch` plugin. The
> `createMatchMediaWatcher` / `watchMatchMedia` subscription helpers have
> also been moved to a future `@ailuracode/alpine-media` service package —
> they manage listener lifecycles, which is a service concern, not a
> core primitive. Core stays generic — only Alpine plugin plumbing and
> SSR-safe wrappers around generic Web APIs.

## Install

```bash
pnpm add @ailuracode/alpine-core alpinejs
```

## Quick start — plugin registry

```ts
import Alpine from 'alpinejs';
import { createAlpinePlugin, definePlugin, registerPlugin } from '@ailuracode/alpine-core';
import { sharePlugin } from '@ailuracode/alpine-transfer';
import { createTheme } from '@ailuracode/alpine-theme';

registerPlugin('share', definePlugin(['magic'], { names: ['share'], plugin: sharePlugin }));
registerPlugin('theme', definePlugin(['store'], { names: ['theme'], plugin: createTheme() }));

// Sync entry — every loader is pre-resolved.
Alpine.plugin(createAlpinePlugin(['share', 'theme']));
Alpine.start();
```

A plugin can register multiple kinds at once — pass the kind list and an
object mapping each kind to its names:

```ts
definePlugin(['magic', 'store'], {
  names: { magic: ['wakelock'], store: ['attention'] },
  plugin: (Alpine) => {
    Alpine.magic('wakelock', () => ({ request: ... }));
    Alpine.store('attention', { ... });
  },
});
```

## Quick start — headless controller

```ts
import { BaseController, type BaseControllerOptions } from '@ailuracode/alpine-core';

interface CounterEvents extends Record<string, unknown> {
    increment: { value: number };
}

class CounterController extends BaseController<CounterEvents> {
    #value = 0;

    constructor(options?: BaseControllerOptions) {
        super(options);
    }

    override mount(): void {
        super.mount();
    }

    increment(by = 1): void {
        this.#value += by;
        this.emit('increment', { value: this.#value });
    }

    override destroy(): void {
        this.#value = 0;
        super.destroy();
    }
}
```

## Lazy dynamic imports

```ts
import { initPlugins, lazyPlugin, registerPlugin } from '@ailuracode/alpine-core';

registerPlugin(
    'share',
    lazyPlugin(['magic'], {
        names: ['share'],
        // The imported module's `default` export MUST itself be a PluginLoader
        // — either a direct `AlpinePluginCallback` or a 0-arg factory returning
        // one (sync or async). `initPlugins()` resolves the loader later.
        import: () => import('@ailuracode/alpine-transfer'),
    }),
);

await initPlugins(Alpine, 'share');
Alpine.start();
```

> **Validation is eager.** Every `definePlugin()` and `lazyPlugin()` call
> runs `assertValidDefinition` immediately. A `definePlugin(['magic'], { names: [] })`
> throws `ToolkitError('PLUGIN_INVALID_DEFINITION')` at the construction
> site, not later inside `registerPlugin()`. This catches the typo next to
> the code that introduced it.

## API

### Registry

| Export                             | Description                                                             |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `registerPlugin(name, definition)` | Register a plugin without initializing it                               |
| `unregisterPlugin(name)`           | Remove a plugin from the registry                                       |
| `getRegisteredPlugin(name)`        | Look up a registered plugin                                             |
| `getRegisteredPlugins()`           | List every plugin in registration order                                 |
| `isPluginInitialized(name)`        | Whether a plugin has run with Alpine                                    |
| `resetPluginRegistry()`            | Clear the registry (tests / storybook)                                  |
| `resolvePluginEntries(names?)`     | Resolve names to registry entries (internal helper, exported for tests) |

### Init

| Export                            | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| `initPlugins(Alpine, names?)`     | Initialize all or selected plugins (async-safe) |
| `initPluginsSync(Alpine, names?)` | Initialize sync plugins only                    |
| `createAlpinePlugin(names?)`      | Alpine.js bridge for sync plugins               |

### Definition helpers

| Export                         | Description                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `definePlugin(kinds, options)` | Build a typed plugin definition; kinds is `readonly ('magic' \| 'store' \| 'directive')[]` |
| `lazyPlugin(kinds, options)`   | Same as `definePlugin` but with a deferred `import()` loader                               |

### Browser capability helpers

| Export                  | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `isBrowser()`           | `true` when `window` and `document` are available                         |
| `safeWindow()`          | `Window` or `null`                                                        |
| `safeDocument()`        | `Document` or `null`                                                      |
| `safeMatchMedia(query)` | `MediaQueryList` or `null` (also when `window.matchMedia` is unavailable) |

### Controller primitives

| Export                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `BaseController<EventMap>`    | Abstract base for every headless controller                 |
| `TypedEventEmitter<EventMap>` | Strongly-typed `on` / `once` / `off` / `emit` bus           |
| `CleanupStack`                | LIFO stack of cleanup callbacks with idempotent `dispose()` |
| `InstanceRegistry<T>`         | Map of controller instances keyed by string ID              |
| `ToolkitError`                | Base error with stable `code` and optional `cause`          |

### Errors

| Export              | Description                             |
| ------------------- | --------------------------------------- |
| `PluginLoaderError` | Thrown when a loader cannot be resolved |
| `ToolkitError`      | Base class for every toolkit error      |

`PluginLoaderError` extends `ToolkitError` with `code: 'PLUGIN_LOADER_INVALID'`.
Consumers should match against `ToolkitError` and branch on `error.code`.

## Plugin kinds

- **magic** — registers Alpine magics such as `$share` or `$calendar`
- **store** — registers Alpine stores such as `$store.theme`
- **directive** — registers Alpine directives such as `x-child`

A single plugin can register any combination of the three by passing a list
of kinds to `definePlugin` (or `lazyPlugin`). The list itself is the
declaration of what the plugin registers; consumers don't have to remember
which "hybrid" helper to reach for.

## SSR

The core never touches `window`, `document`, or `navigator` at import time.
Plugin loaders run only when you call `initPlugins()` or
`createAlpinePlugin()`. Importing the package from a Node server returns
`null` from every `safeX` helper without throwing.

## TypeScript

```ts
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-core/global" />
```

The `global` subpath mirrors `@types/alpinejs` so consumers that only augment
`Alpine.*` do not pull in the runtime entrypoint.

## License

MIT
