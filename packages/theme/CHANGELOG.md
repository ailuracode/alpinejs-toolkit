# @ailuracode/alpine-theme

## 1.0.0

### Minor Changes

- 7a9418a: Drop the `declare global { namespace Alpine }` augmentation in `src/global.d.ts` — `global.d.ts` now only re-exports `ThemeStore` (matches `@ailuracode/alpine-core`'s stance). Consumers that depended on the triple-slash augmentation should declare it in their own `*.d.ts` or use `Alpine<{ theme: ThemeStore }>` from `@ailuracode/alpine-core`. Replace the package-local `ThemeAlpine` definition with the toolkit's generic `Alpine<{ theme: ThemeStore }>` (intersected with `cleanup?`). Fix `ThemeController` constructor calling `super({ id })` with an object instead of a string. Fix `local-storage.ts` type-only import. Build migrated from `tsc` + inline `node -e` to `tsup`. Remove unused `demo`/`demo:build`/`demo:preview` scripts.
- 7a9418a: Fix cross-tab null propagation. `ThemeStorage.subscribe` listener signature widened to `(next: ThemePreference | null) => void`; the in-memory and localStorage adapters now emit `null` when the underlying store is cleared (previously they emitted `'system'`, which was a fabricated value). The controller treats `null` as "external clear" and applies the configured default with `source: 'storage'`. The `#lastWritten` echo marker now uses `undefined` as the "no pending echo" sentinel so legitimate cross-tab clears are no longer mistaken for self-echoes after `reset()`.

  Break the `events.ts ↔ types.ts` import cycle. `ThemeState`, `ThemeChangeSource`, and `ThemeChangeDetail` now live in `types.ts` (where the manager interface references them); `events.ts` owns the `ThemeEvents` event map and the `ThemeListener` alias.

  Move `buildDomOptions` from `controller.ts` to `internal/dom-strategy/options.ts` (it configures strategies, lives next to them). Extract `defaultDomTarget` to `internal/dom-strategy/default-target.ts` (was duplicated in `class.ts` and `attribute.ts`). Inline `createThemeStore` in `plugin.ts` — drop the `as ThemeStore` cast and the `seedStoreFields` / `bindStoreCommands` / `syncFromManager` helpers.

  Reorder `index.ts` exports by domain. `destroy()` order is now `super.destroy()` first (runs registered cleanups against a live lifecycle), then `this.#dom.destroy()`. The `Extract<ThemeChangeSource, ...>` inline type on `applySet` becomes a named `ApplySetSource` alias. `localStorage` private helpers (`readLocalStorage`, `writeLocalStorage`, `removeLocalStorage`, `subscribeLocalStorage`) are no longer exported.

- 7a9418a: `ThemeController` now composes a `ToggleController<'light', 'dark', 'system'>` from `@ailuracode/alpine-toggle` internally to model the three-value `current` state machine. Public API unchanged — every existing test passes against the new composition. Persistence, DOM application, system observation, and cross-tab synchronization continue to live on `ThemeController`. `@ailuracode/alpine-toggle@^0.3` is now a peer dependency.

### Patch Changes

- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0
  - @ailuracode/alpine-toggle@1.0.0
