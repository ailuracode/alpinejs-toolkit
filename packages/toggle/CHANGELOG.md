# @ailuracode/alpine-toggle

## 1.0.0

### Major Changes

- 7a9418a: Breaking rewrite aligned to `@ailuracode/alpine-theme@0.2.x`. State property names renamed from `truly` / `falsely` / `ternary` to `on` / `off` / `indeterminate`. Method `cycle()` renamed to `next()`. `set(value)` now returns `void` instead of `boolean`. The controller now extends `BaseController` from `@ailuracode/alpine-core`, exposing `id`, `phase`, `isMounted`, `isDestroyed`, `mount()`, `destroy()`, and a typed `on('change', listener)` event bus with `{ current, previous, source }` detail payload. The default export `togglePlugin` is gone — use the named `togglePlugin(options?)` factory (matches `themePlugin`). The `createToggleMagic()` helper is gone — the plugin inlines the magic factory; standalone consumers use `createToggle(options)` which now returns a `ToggleController`. `@ailuracode/alpine-core` is now a peer dependency. Migration table in the [package README](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme).

### Minor Changes

- 7a9418a: Add `setSilently(value)` to `ToggleController` — sets the value without emitting a `change` event. Hydrates the controller from an external authoritative source (e.g. `localStorage`) without broadcasting a transition. The queued initialization microtask now preserves any value hydrated via `setSilently` before it fires, instead of resetting to the original `initial` config. Behavior of `reset()` and the public event surface is unchanged.

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.
