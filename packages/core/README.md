# @ailuracode/alpine-core

Reusable infrastructure for the
[`@ailuracode/alpinejs-toolkit`](https://github.com/ailuracode/alpinejs-toolkit)
monorepo.

`@ailuracode/alpine-core` exposes two layers:

1. **Plugin registry + Alpine bridge** — register plugins at import time,
   initialize them on demand, support both sync and dynamic `import()`
   loaders, stay SSR-safe.
2. **Headless controller primitives** — `BaseController`,
   `EventEmitter`, `CleanupStack`, `InstanceRegistry`, and
   `ToolkitError`. Every feature package in this monorepo is built on
   top of them.

This package MUST NOT become a container for feature-specific helpers —
[per `AGENTS.md`](../../AGENTS.md) every abstraction here is generic,
free of feature-specific behavior, and used (or going to be used) by at
least two packages.

## Install

```bash
pnpm add @ailuracode/alpine-core alpinejs
```

## Quick start — plugin registry

```ts
import Alpine from 'alpinejs';
import {
  createAlpinePlugin,
  definePlugin,
  pluginLoader,
  registerPlugin,
} from '@ailuracode/alpine-core';
import { themePlugin } from '@ailuracode/alpine-theme';

registerPlugin(
  'theme',
  definePlugin(['store'], {
    names: ['theme'],
    plugin: pluginLoader(() => themePlugin()),
  }),
);

// Sync entry — every loader is pre-resolved.
Alpine.plugin(createAlpinePlugin(['theme']));
Alpine.start();
```

Direct Alpine callbacks can be passed without wrapping:

```ts
definePlugin(['magic'], { names: ['share'], plugin: (Alpine) => { /* ... */ } });
```

Lazy sync or async factories **must** use `pluginLoader()`:

```ts
definePlugin(['store'], {
  names: ['theme'],
  plugin: pluginLoader(() => themePlugin()),
});
```

A plugin can register multiple kinds at once — pass the kind list and an
object mapping each kind to its names:

```ts
definePlugin(['magic', 'store'], {
  names: { magic: ['wakelock'], store: ['attention'] },
  plugin: (Alpine) => {
    Alpine.magic('wakelock', () => ({ request: /* ... */ }));
    Alpine.store('attention', { /* ... */ });
  },
});
```

## Quick start — headless controller

```ts
import { BaseController } from '@ailuracode/alpine-core';

interface CounterEvents extends Record<string, unknown> {
  increment: { value: number };
}

class CounterController extends BaseController<CounterEvents> {
  #value = 0;

  constructor(id?: string) {
    super(id);
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

## Why

| Problem                                                           | This package solves it by                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Plugins run side effects the moment they're imported              | `registerPlugin()` only stores the definition                                                  |
| Dynamic `import()` can't be awaited before `Alpine.start()`       | `initPlugins()` resolves every loader (sync or async) before the consumer's bootstrap          |
| Mixed sync/async code paths produce subtle init order bugs        | `initPluginsSync()` / `createAlpinePlugin()` enforce a single sync code path                   |
| `window.matchMedia` throws on the server                          | `safeMatchMedia()`, `isBrowser()`, `safeWindow()`, `safeDocument()` guard DOM access           |
| Every feature reinvents its own lifecycle, event bus, and cleanup | `BaseController` + `CleanupStack` + `EventEmitter` + `InstanceRegistry` ship the contract     |

> **What core is NOT.** Core stays generic — only Alpine plugin plumbing
> and SSR-safe wrappers around generic Web APIs. Feature-specific
> helpers (touch detection, media-query subscription, etc.) belong in
> dedicated packages.

## Lazy dynamic imports

```ts
import { initPlugins, lazyPlugin, registerPlugin } from '@ailuracode/alpine-core';

registerPlugin(
  'share',
  lazyPlugin(['magic'], {
    names: ['share'],
    // The imported module's `default` export is a direct callback or an
    // explicit `pluginLoader()` / `pluginCallback()` source.
    // `initPlugins()` resolves the loader later.
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
| `isPluginInitialized(name, Alpine)`        | Whether a plugin has run on the given Alpine runtime                    |
| `markPluginInitialized(name, Alpine)`      | Mark a plugin as initialized on a runtime (adapters / sync paths)       |
| `resetPluginRegistry()`            | Clear the registry (tests / storybook)                                  |
| `resolvePluginEntries(names?)`     | Resolve names to registry entries (internal helper, exported for tests) |
| `setRegistryDebugSink(sink)`       | Forward registry events to a `DebugLogger`                              |
| `getRegistryDebugSink()`           | Retrieve the configured debug sink                                      |

### Init

| Export                            | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| `initPlugins(Alpine, names?)`     | Initialize all or selected plugins (async-safe) |
| `initPluginsSync(Alpine, names?)` | Initialize sync plugins only                    |
| `createAlpinePlugin(names?)`      | Alpine.js bridge for sync plugins               |

### Definition helpers

| Export                         | Description                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `definePlugin(kinds, options)` | Build a typed plugin definition; `kinds` is `readonly ('magic' \| 'store' \| 'directive')[]` |
| `lazyPlugin(kinds, options)`   | Same as `definePlugin` but with a deferred `import()` loader                               |
| `pluginCallback(callback)`     | Mark a direct Alpine callback (optional — raw callbacks are accepted)                      |
| `pluginLoader(load)`           | Mark a lazy sync or async factory that returns an Alpine callback                          |

Both `definePlugin` and `lazyPlugin` accept a `kinds` array and a
`names` field whose shape depends on `kinds`:

```ts
// Single kind — flat names array
definePlugin(['magic'], { names: ['share'], plugin: cb });
definePlugin(['store'], { names: ['theme'], plugin: cb });
definePlugin(['directive'], { names: ['x-child'], plugin: cb });

// Multiple kinds — names becomes an object keyed by kind
definePlugin(['magic', 'store'], {
  names: { magic: ['wakelock'], store: ['idle'] },
  plugin: cb,
});
```

Pass `{ allowNameCrossKind: true }` to allow the same name under
multiple kinds of one plugin (e.g. `magic: ['theme']` + `store: ['theme']`).

### Browser capability helpers

| Export                  | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `isBrowser()`           | `true` when `window` and `document` are available                         |
| `safeWindow()`          | `Window` or `null`                                                        |
| `safeDocument()`        | `Document` or `null`                                                      |
| `safeMatchMedia(query)` | `MediaQueryList` or `null` (also when `window.matchMedia` is unavailable) |

### Controller primitives

| Export                    | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `BaseController<EventMap>`| Abstract base for every headless controller                 |
| `EventEmitter<EventMap>`  | Strongly-typed `on` / `once` / `off` / `emit` bus           |
| `CleanupStack`            | LIFO stack of cleanup callbacks with idempotent `dispose()` |
| `InstanceRegistry<T>`     | Map of controller instances keyed by string ID              |
| `ToolkitError`            | Base error with stable `code` and optional `cause`          |

### Plugin DOM events

Toolkit packages expose observable behavior through Alpine listeners using
the `@package:event` convention. The underlying DOM event name is
`package:event` (for example `toggle:change`, `dialog:before-close`).

```html
<div
  @toggle:change="handleToggle($event.detail)"
  @dialog:before-close="validateClose($event)"
  @theme:change.window="syncTheme($event.detail)"
></div>
```

| Export | Description |
| ------ | ----------- |
| `dispatchPluginEvent(target, namespace, event, detail, options?)` | Dispatch a namespaced `CustomEvent` with toolkit defaults |
| `PluginEventMap` | Augmentable map of event names to detail types |
| `PluginEventName<TNamespace, TEvent>` | Template-literal event name helper |
| `PluginCustomEvent<TName>` | Typed `CustomEvent` for map entries |
| `ChangeSource` | Normalized `source` union for change payloads |
| `DispatchPluginEventOptions` | `bubbles`, `composed`, `cancelable` overrides |

Defaults: `bubbles: true`, `composed: true`, `cancelable: false`.
Cancelable lifecycle hooks opt in explicitly:

```ts
const event = dispatchPluginEvent(element, 'dialog', 'before-close', detail, {
  cancelable: true,
});

if (event.defaultPrevented) {
  return false;
}
```

Packages augment the shared event map:

```ts
declare module '@ailuracode/alpine-core' {
  interface PluginEventMap {
    'toggle:change': ToggleChangeDetail;
    'dialog:before-close': DialogBeforeCloseDetail;
  }
}
```

**Dispatch targets**

- Element-bound directives — dispatch from the owning element.
- Global stores — dispatch from `window` unless a more specific target exists.
- Unattached controller factories — do not emit DOM events until wired
  through Alpine integration.

**When not to add an event**

- The behavior is already covered by a native DOM event (`play`, `focus`,
  `scroll`, …).
- The event would mirror every controller method instead of observable
  lifecycle or state transitions.
- A hidden global event bus would be required — prefer native propagation.

See [`docs/guides/plugin-events.md`](../../docs/guides/plugin-events.md)
for the full contributor contract.

### Controller-backed Alpine lifecycle bridge

Use these helpers when a feature package wires a headless controller
into `$store.*` and a matching `$name` magic. They centralize the
invariant adapter sequence while leaving store synchronization in the
feature package.

| Export | Description |
| ------ | ----------- |
| `bridgeControllerStore(options)` | Registers the store proxy, magic accessor, subscription cleanup, and `controller.destroy()` |
| `bridgeControllerDirective(options)` | Registers an Alpine directive with guarded collision detection and cleanup |
| `registerReactiveStore(alpine, key, store)` | Registers a store and returns Alpine's reactive proxy |
| `registerStoreMagic(alpine, key, accessor)` | Registers a magic that returns a stable reference |
| `syncRecordFromSnapshot(target, snapshot)` | Mirrors keyed instance registries onto reactive stores |
| `wireControllerLifecycle(alpine, controller, options)` | Forwards teardown through `Alpine.cleanup` |

**Cleanup order** (documented and tested):

1. Controller event-bus unsubscribes (LIFO)
2. Adapter-specific cleanups such as DOM listeners (LIFO)
3. `controller.destroy()`

**When to use the bridge**

- Controller-backed store plugins that mirror controller `change` events
  onto a reactive store proxy (`theme`, `sidebar`, `media`, `scroll`, …).
- Prefer `bridgeControllerStore()` when the magic returns the store
  proxy. Use the lower-level helpers when the magic is a composite API
  (for example `$toast`).
- Directive plugins — `bridgeControllerDirective()` is the symmetric
  helper for `x-child`, `x-gesture`, and any plugin that registers an
  `Alpine.directive(...)` instead of a store + magic pair.

**When a custom adapter is justified**

- Instance-registry plugins that sync `instances` maps and expose
  per-id helpers (`dialog`, `menu`, `carousel`, …).
- Adapters that register multiple stores or magics from one controller.
- Plugins that register more than one directive per call.

Store field mirroring MUST stay in the package's `subscribe` callback —
the bridge does not hide domain-specific synchronization.

### `bridgeControllerDirective`

Counterpart to `bridgeControllerStore` for plugins that register a single
Alpine directive. The collision policy mirrors the store/magic helper —
default `registrationOverride: true` keeps HMR and tests working, opt in
to `registrationOverride: false` when the host application or a sibling
plugin is expected to register the same directive name.

```ts
import { bridgeControllerDirective } from "@ailuracode/alpine-core";

bridgeControllerDirective({
  alpine,
  directiveKey: "child",
  directive: (el) => { /* ... */ },
  packageName: "child",
  controller: childController, // optional
});
```

Cleanup order (when `controller` is supplied):

1. `controller.destroy()` — release any held resources
2. `untrackDirective(directiveKey)` — clear the guard's tracking entry

When `controller` is omitted the directive is registered without any
destroy hook; only `untrackDirective` runs so HMR / repeated integration
tests do not collide with themselves.

### Generic Alpine typings

| Export                | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `Alpine<Stores>`      | Typed view of `Alpine` whose `store()` overloads narrow to `Stores` |
| `PluginCallback<T>`   | Generic `Alpine.plugin()` callback typed against an `Alpine` view   |

### Errors

| Export              | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `PluginLoaderError` | Thrown when a loader cannot be resolved                                    |
| `RegistrationError` | Thrown when a guard refuses a store/magic/directive because the name is taken |
| `ToolkitError`      | Base class for every toolkit error                                         |

`PluginLoaderError` extends `ToolkitError` with `code: 'PLUGIN_LOADER_INVALID'`.
`RegistrationError` extends `ToolkitError` with `code: 'REGISTRATION_COLLISION'` and
exposes `kind`, `registrationName`, and `packageName` so callers can route the error
to the right plugin. Consumers match against `ToolkitError` and branch on `error.code`.

## Registration guards

By default Alpine 3 silently overwrites whatever a previous plugin registered under
the same key. That is convenient until two plugins race for `$store.theme` — the
loser disappears with no warning. Core ships a thin guard layer so every feature
plugin refuses a collision the same way.

```ts
import {
  guardDirective,
  guardMagic,
  guardStore,
  RegistrationError,
} from "@ailuracode/alpine-core";

guardStore(Alpine, "theme", themeStore, "alpine-theme");
// → registers $store.theme, or throws RegistrationError("REGISTRATION_COLLISION")
//   if the host (or another plugin) already owns the key.

guardMagic(Alpine, "theme", () => themeStore, "alpine-theme");
guardDirective(Alpine, "x-child", directive, "alpine-child");
```

When the guard throws the error message points the host at the right factory:

```
store "theme" is already registered. If you registered this store yourself,
rename it or pass { override: true } to themePlugin() to replace it. If
another plugin registered it, configure themePlugin() with storeKey/magicKey.
```

| Export                              | Description                                                            |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `guardStore(Alpine, name, value, packageName, options?)` | Register `Alpine.store(name, …)` and throw if the key is already taken |
| `guardMagic(Alpine, name, accessor, packageName, options?)` | Register `Alpine.magic(name, …)` with internal collision tracking |
| `guardDirective(Alpine, name, directive, packageName, options?)` | Register `Alpine.directive(name, …)` with internal collision tracking |
| `RegistrationError`                 | `ToolkitError` subclass with `kind`, `registrationName`, `packageName` |
| `resetRegistrationTracking()`       | Clear the magic/directive tracking sets (used by the global test setup between specs) |

`storeKey` / `magicKey` / `directiveName` are the escape hatch every feature
plugin is expected to expose — pass a renamed key to bypass the collision without
touching the controller.

`guardStore` returns the same reactive proxy Alpine hands back, so plugins can
mirror `Alpine.store("theme", …)` and read the reactive proxy through one call:

```ts
const { reactiveStore } = guardStore(Alpine, "theme", themeStore, "alpine-theme");
reactiveStore.current = nextPreference;
```

### Options

| Option     | Type      | Default | Effect                                                                                  |
| ---------- | --------- | ------- | --------------------------------------------------------------------------------------- |
| `override` | `boolean` | `false` | When `true`, the guard replaces the existing registration instead of throwing            |
| `silent`   | `boolean` | `false` | When `true`, `console.warn` is not emitted on an `override: true` replacement            |

### Why a `packageName`?

Every error message names the factory that owns the guard (`themePlugin()`,
`scrollPlugin()`, …). The package name is the only signal a host gets to know
which `storeKey` to rename or which factory to configure with `override: true`.
Pass it explicitly — there is no inference from the call site.

> The `architecture:check` script enforces that no package outside
> `packages/core/src/registration.ts` calls `Alpine.store` / `Alpine.magic` /
> `Alpine.directive` directly. Feature packages must route their registrations
> through the guards (this is what `bridgeControllerStore` does internally).
> Packages that have not yet migrated are tracked in
> `architecture-check-policy.mjs#registrationGuardPending` and removed from
> that list as they adopt `guardStore` / `guardMagic` / `guardDirective`.

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
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-core/global" />
```

The `./global` subpath re-exports the named-export surface of
`@types/alpinejs` so consumers that augment `Alpine.*` do not have to
add the `@types/alpinejs` triple-slash directive on top. Per the
toolkit convention, this package does NOT augment external modules —
consumers type their runtime with `Alpine<Stores>` from
`@ailuracode/alpine-core` instead.

## License

MIT