---
"@ailuracode/alpine-core": minor
---

Trim over-engineering in `@ailuracode/alpine-core` while preserving the
public surface that downstream packages and tests already depend on.

**Removed**

- `registerReactiveStore` and `registerStoreMagic` wrappers from the
  lifecycle bridge. `bridgeControllerStore` already routes through the
  registration guards internally — these were 1-line wrappers that hid
  the proxy behind a return object.
- `DebugEvent` / `DebugLogger` / `DebugOption` re-exports from the
  package surface. They were unused stubs living in `src/internal/debug.ts`;
  the file is removed entirely.
- The `src/core/` subdirectory that grouped the foundational primitives
  (`controller.ts`, `cleanup.ts`, `controller-id.ts`, `error.ts`,
  `event.ts`, `type.ts`). The package is small enough that a flat
  `src/<file>.ts` layout (matching the convention used by most
  feature packages in the monorepo — `menu`, `dialog`, `tabs`,
  `command`, `keyboard`, `history`, `toast`, `toggle`, …) is clearer.
- `src/internal/` directory — same reason: it only ever held the debug
  stubs.
- `BridgeControllerDirectiveOptions<TController>` parametric generic —
  callers were not annotating it, so the inference added no value.
- Unused `ToolkitErrorCode` variants:
  `PLUGIN_NAME_REQUIRED`, `PLUGIN_DUPLICATE`, `PLUGIN_UNKNOWN`,
  `PLUGIN_INVALID_DEFINITION`, `PLUGIN_LOADER_INVALID`,
  `PLUGIN_INIT_IN_FLIGHT`.
- `dispatchPluginEvent` and the `PluginEventName` /
  `PluginEventMap` / `DispatchPluginEventOptions` types. No downstream
  package (or test outside `packages/core/test/plugin-event.spec.ts`,
  which has been deleted) was using them — `CustomEvent` covers the
  two ad-hoc consumers in `e2e/fixture/main.ts`.
- `InstanceRegistry` / `RegisteredInstance` from `core/registry.ts`.
  Every feature package that registered multiple instances ships its
  own `syncInstanceRegistry` helper in its `src/store.ts`, so the
  generic registry was unused duplication.
- The standalone `singleton-scope.ts` module. Its exports
  (`runWithSingletonScope`, `resolveSingletonScope`,
  `attachSingletonScope`, `readSingletonScope`, `clearAmbientScope`,
  `setSingleton`, `clearSingleton`, `getSingleton`, `runWith…`) had
  no consumers outside `core/test/singleton.spec.ts`. They are folded
  into `singleton.ts` as module-private helpers alongside the
  publicly-used `createSingleton`, `createSingletonScope`,
  `releaseSingleton`, and `clearAllSingletons`.
- `RegistrationKind`, `RegistrationErrorCode`, and `GuardedStoreResult`
  from the package surface. They leak only into `RegistrationError`
  (kept exported) and the `guardX` return shapes — none are imported
  by downstream packages.

**Changed**

- `BaseController` now stores `#mounted` / `#destroyed` as flags instead
  of a `#phase` enum. The `phase` getter is kept as a derived alias of
  the two flags so callers that read `controller.phase === "mounted"`
  continue to work. `destroy()` resets `#mounted` to `false` so failed
  `mount()` flows leave the controller in a coherent state.
- `BaseController.listenerCount(event?)` is exposed as a thin proxy over
  `EventEmitter.listenerCount` (downstream packages and tests read it
  through the controller surface).
- `CleanupStack.dispose()` now aggregates multiple cleanup errors via
  `AggregateError` instead of swallowing everything after the first
  thrown callback.
- `RegistrationError` accepts an optional `factoryName` so the hint
  message no longer assumes the `${package}Plugin()` convention.
- `singleton.ts` no longer exposes the registry as `setSingleton` /
  `clearSingleton` / `getSingleton`; the public surface is now
  `createSingleton`, `createSingletonScope`, `releaseSingleton`, and
  `clearAllSingletons` (plus the `SingletonScope` / `SingletonInitOptions`
  types used for the `scope` / `options` arguments).
- The lifecycle bridge collapses two prior helpers (`wireControllerLifecycle`
  + the inline `cleanup` wiring in `bridgeControllerStore` /
  `bridgeControllerDirective`) into a single `wireControllerLifecycle`
  implementation. The previously inlined `if (typeof alpine.cleanup === ...)`
  branches now go through it, so the subscription/destroy order is
  easier to reason about and only one place needs to change when the
  `cleanup` callback contract evolves.

**Tree-shaking fixture**

- `test/tree-shaking-smoke.test.ts` was probing `registerPlugin`, a name
  that no longer exists in the public surface. Switched the fixture to
  `bridgeControllerStore`, which exercises the same code path
  (controller-backed store + magic + cleanup).

**Note on `0.x` versioning**

`@ailuracode/alpine-core` is currently on the `0.x` line. Per semver,
breaking changes within `0.x` are signalled by a `minor` bump — this
release goes from `0.2.2` to `0.3.0`, not to `1.0.0`. Consumers using
`^0.2.x` will receive the update; consumers pinned to `0.2.2` will not.

**Unpublished versions**

The following `@ailuracode/alpine-core` versions were unpublished from
npm prior to this release: **none**. Both `0.2.1` and `0.2.2` are still
on npm (their removal failed due to active dependents). Pin directly
to `0.3.0` if you need deterministic resolution.
