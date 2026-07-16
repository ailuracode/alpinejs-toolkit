# @ailuracode/alpine-core

Reusable infrastructure for the
[`@ailuracode/alpinejs-toolkit`](https://github.com/ailuracode/alpinejs-toolkit)
monorepo.

`@ailuracode/alpine-core` exposes three layers:

1. **Headless controller primitives** — `BaseController`, `EventEmitter`,
   `CleanupStack`, and `ToolkitError`. Every feature package in this
   monorepo is built on top of them.
2. **Singleton registry** — `createSingleton`, `releaseSingleton`, and
   `clearAllSingletons` give feature packages a single-instance-per-scope
   contract without leaking Alpine internals.
3. **Alpine registration guards + controller bridge** — `guardStore`,
   `guardMagic`, `guardDirective`, `bridgeControllerStore`, and
   `bridgeControllerDirective` make registration order, override
   semantics, and lifecycle cleanup explicit.

This package MUST NOT become a container for feature-specific helpers —
[per `AGENTS.md`](../../AGENTS.md) every abstraction here is generic,
free of feature-specific behavior, and used (or going to be used) by at
least two packages.

## Install

```bash
pnpm add @ailuracode/alpine-core alpinejs
```

## Quick start — headless controller

```ts
import { BaseController } from "@ailuracode/alpine-core";

interface CounterEvents extends Record<string, unknown> {
  increment: { value: number };
}

class CounterController extends BaseController<CounterEvents> {
  #value = 0;

  override mount(): void {
    super.mount();
  }

  increment(by = 1): void {
    this.#value += by;
    this.emit("increment", { value: this.#value });
  }

  override destroy(): void {
    this.#value = 0;
    super.destroy();
  }
}
```

## Quick start — singleton registry

`createSingleton` returns the same instance on every call with the same
`key` + `scope` pair. The default scope is `document` in the browser, so
feature packages get a single instance per page automatically. Tests and
SSR consumers can pass any plain object as `scope`:

```ts
import { createSingleton } from "@ailuracode/alpine-core";

const theme = createSingleton("theme", () => new ThemeController());

// Independent instances when a custom scope is provided
const scopeA = {};
const scopeB = {};
createSingleton("theme", () => new ThemeController(), { scope: scopeA });
createSingleton("theme", () => new ThemeController(), { scope: scopeB });
```

`SingletonScope` is just `object`, so any unique reference works.

## Quick start — registration guards

By default Alpine 3 silently overwrites whatever a previous plugin
registered under the same key. Core ships a thin guard layer so every
feature plugin refuses a collision the same way:

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

Pass `{ override: true }` to replace a previous registration without
throwing. The guard does not emit warnings on override — collisions are
either accepted (override) or rejected (throw). The error message points
the host at the right factory:

```
store "theme" is already registered. Pass { override: true } to
alpine-themePlugin() or use a unique key to replace it.
```

## Quick start — controller-backed Alpine bridge

Most feature packages wire a headless controller into `$store.*` and a
matching `$name` magic. The bridge centralizes that sequence while
leaving store synchronization in the feature package:

```ts
import { bridgeControllerStore } from "@ailuracode/alpine-core";

bridgeControllerStore({
  alpine: Alpine,
  storeKey: "theme",
  store: themeStore,
  controller: themeController,
  packageName: "alpine-theme",
  magicKey: "theme",
});
```

The directive counterpart is symmetric:

```ts
import { bridgeControllerDirective } from "@ailuracode/alpine-core";

bridgeControllerDirective({
  alpine: Alpine,
  directiveKey: "child",
  directive: (el) => {
    /* ... */
  },
  packageName: "alpine-child",
  controller: childController, // optional
});
```

**Cleanup order** (documented and tested):

1. Controller event-bus unsubscribes (LIFO)
2. Adapter-specific cleanups such as DOM listeners (LIFO)
3. `controller.destroy()`

## API

### Controller primitives

| Export                     | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `BaseController<EventMap>` | Abstract base for every headless controller                 |
| `EventEmitter<EventMap>`   | Strongly-typed `on` / `once` / `off` / `emit` bus           |
| `CleanupStack`             | LIFO stack of cleanup callbacks with idempotent `dispose()` |
| `ToolkitError`             | Base error with stable `code` and optional `cause`          |
| `generateId(prefix)`       | Monotonic, base-36 ID generator (`counter` lives in core)   |
| `LifecyclePhase`           | `"idle" \| "mounted" \| "destroyed"` literal union          |

### Singleton registry

| Export                            | Description                                                              |
| --------------------------------- | ------------------------------------------------------------------------ |
| `createSingleton(key, factory, init?)` | Return the same instance on every call with the same `key` + `scope` pair |
| `releaseSingleton(key, instance)` | Release a registered singleton so the next call rebuilds it              |
| `clearAllSingletons()`            | Drop every registered instance — used by test setups between specs       |
| `SingletonScope`                  | `object` — any unique reference (e.g. `{}`)                              |
| `SingletonInitOptions`            | `{ scope?: SingletonScope }`                                             |

### Browser capability helpers

| Export                  | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `isBrowser()`           | `true` when `window` and `document` are available                         |
| `safeWindow()`          | `Window` or `null`                                                        |
| `safeDocument()`        | `Document` or `null`                                                      |
| `safeMatchMedia(query)` | `MediaQueryList` or `null` (also when `window.matchMedia` is unavailable) |

### Registration guards

| Export                                                         | Description                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `guardStore(Alpine, name, value, packageName, options?)`       | Register `Alpine.store(name, …)` and throw if the key is already taken |
| `guardMagic(Alpine, name, accessor, packageName, options?)`    | Register `Alpine.magic(name, …)` with internal collision tracking      |
| `guardDirective(Alpine, name, directive, packageName, options?)` | Register `Alpine.directive(name, …)` with internal collision tracking  |
| `RegistrationError`                                            | `ToolkitError` subclass with `kind`, `registrationName`, `packageName` |
| `resetRegistrationTracking()`                                  | Clear the magic / directive tracking sets (test setup between specs)   |
| `RegistrationGuardOptions`                                     | `{ override?: boolean }`                                               |

`guardStore` returns the reactive proxy Alpine hands back, so plugins
can mirror `Alpine.store("theme", …)` and read the reactive proxy
through one call:

```ts
const store = guardStore(Alpine, "theme", themeStore, "alpine-theme");
store.current = nextPreference;
```

#### Options

| Option     | Type      | Default | Effect                                                          |
| ---------- | --------- | ------- | --------------------------------------------------------------- |
| `override` | `boolean` | `false` | When `true`, the guard replaces the existing registration        |

### Controller-backed Alpine bridge

| Export                                          | Description                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `bridgeControllerStore(options)`                | Registers the store proxy, magic accessor, subscription cleanup, and `controller.destroy()`  |
| `bridgeControllerDirective(options)`            | Registers an Alpine directive with guarded collision detection and cleanup                    |
| `syncRecordFromSnapshot(target, snapshot)`      | Mirrors keyed instance registries onto reactive stores                                       |
| `Destroyable`                                   | Type-level contract: anything with a `destroy()` method                                      |
| `AlpineLifecycleHost`                           | `Alpine` + optional `cleanup` callback (provided by `alpine-cleanup`)                        |
| `BridgeControllerDirectiveOptions`              | Options for `bridgeControllerDirective`                                                      |
| `ControllerStoreBridgeOptions<TStore, TController>` | Options for `bridgeControllerStore`                                                       |
| `WireControllerLifecycleOptions`                | Internal subscription + cleanup batch passed through to `Alpine.cleanup`                    |

### Errors

| Export              | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `ToolkitError`      | Base class for every toolkit error                                         |
| `ToolkitErrorCode`  | Union of every stable error code (`REGISTRATION_COLLISION`, …)             |
| `RegistrationError` | Thrown when a guard refuses a store / magic / directive collision          |

`RegistrationError` extends `ToolkitError` with `code: 'REGISTRATION_COLLISION'`
and exposes `kind`, `registrationName`, and `packageName` so callers can
route the error to the right plugin. Consumers match against `ToolkitError`
and branch on `error.code`.

### Generic Alpine typings

| Export              | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `Alpine<Stores>`    | Typed view of `Alpine` whose `store()` overloads narrow to `Stores` |
| `PluginCallback<T>` | Generic `Alpine.plugin()` callback typed against an `Alpine` view   |
| `Unsubscribe`       | `() => void` — cleanup callback returned by every subscription API  |

> The `architecture:check` script enforces that no package outside
> `packages/core/src/registration.ts` calls `Alpine.store` / `Alpine.magic` /
> `Alpine.directive` directly. Feature packages must route their
> registrations through the guards — this is what `bridgeControllerStore`
> does internally.

## SSR

The core never touches `window`, `document`, or `navigator` at import time.
Every browser API is gated through `typeof window` / `typeof document`
checks inside the `safeX` helpers. Importing the package from a Node
server returns `null` from every `safeX` helper without throwing, and
`createSingleton()` falls back to `document` only when one is actually
available.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
```

The package augments external modules through `declare global` blocks
inside the source files, so consumers that type their runtime with
`Alpine<Stores>` get narrowed `Alpine.store()` overloads without adding
extra triple-slash directives.

## License

MIT
