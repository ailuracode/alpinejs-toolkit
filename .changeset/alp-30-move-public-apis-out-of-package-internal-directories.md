---
"@ailuracode/alpine-core": minor
"@ailuracode/alpine-lang": minor
"@ailuracode/alpine-media": minor
"@ailuracode/alpine-theme": minor
---

Move all public API modules out of `src/internal/` directories and into top-level `src/` locations so the public surface stays consistent with the architecture visibility contract (ALP-30). No runtime behavior changes — every previously-public helper is still reachable through the package barrel.

## `@ailuracode/alpine-core`

The following modules moved from `src/internal/` to `src/`:

| Module | Exports |
|--------|---------|
| `browser.ts` | `isBrowser`, `safeDocument`, `safeMatchMedia`, `safeWindow` |
| `define.ts` | `definePlugin`, `lazyPlugin`, `DefinePluginOptions`, `LazyPluginOptions` |
| `init.ts` | `createAlpinePlugin`, `initPlugins`, `initPluginsSync` |
| `loader.ts` | `PluginLoaderError` |
| `registry.ts` | `registerPlugin`, `unregisterPlugin`, `getRegisteredPlugin`, `getRegisteredPlugins`, `isPluginInitialized`, `markPluginInitialized`, `resetPluginRegistry`, `resolvePluginEntries`, `setRegistryDebugSink`, `getRegistryDebugSink`, `RegistryEventLike` |
| `singleton.ts` | `createSingleton`, `getSingleton`, `setSingleton`, `clearSingleton`, `clearAllSingletons` |

`internal/` now contains only `assert.ts` (truly private validation).

## `@ailuracode/alpine-lang`

| Module | Exports |
|--------|---------|
| `language-tag.ts` | `normalizeLanguageTag`, `parseLanguageTag` |

`internal/` is now empty and has been removed.

## `@ailuracode/alpine-media`

| Module | Exports |
|--------|---------|
| `breakpoint.ts` | `resolveMediaBreakpoint` |

`internal/` keeps only the truly-private runtime helpers (`match-media.ts`, `viewport.ts`, `visibility.ts`).

## `@ailuracode/alpine-theme`

The following modules moved from `src/internal/` to `src/`:

| Module | Exports |
|--------|---------|
| `local-storage.ts` | `createLocalStorageThemeStorage`, `LocalStorageThemeStorageOptions` |
| `memory-storage.ts` | `createMemoryThemeStorage` |
| `system-observer.ts` | `readSystemTheme` |

`internal/storage/` was emptied by this move and has been removed. `internal/` keeps `validation.ts`, `browser.ts`, and `dom-strategy/` (all truly private).

## Migration

The public package barrel (`@ailuracode/alpine-core`, etc.) keeps exporting every helper with the same name. Application-level consumers don't need any changes — only direct imports into the internal subpath (which violates the architecture contract) are affected.

If your codebase currently imports from a subpath that was moved (e.g. accidentally through `@ailuracode/alpine-core/internal/browser`), update the import to the public barrel or the new top-level path:

```diff
- import { isBrowser } from "@ailuracode/alpine-core/internal/browser";
+ import { isBrowser } from "@ailuracode/alpine-core";
```

## Architecture tooling

A new top-level test (`test/architecture-boundary.test.ts`) enforces the contract: any future `src/index.ts` barrel re-exporting from `src/internal/` fails CI.

A companion test (`test/public-surface-contract.test.ts`) locks the public surface contract of every moved helper so a future refactor cannot silently drop a public export.
