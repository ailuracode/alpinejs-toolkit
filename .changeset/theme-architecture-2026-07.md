---
"@ailuracode/alpine-theme": minor
---

Fix cross-tab null propagation. `ThemeStorage.subscribe` listener signature widened to `(next: ThemePreference | null) => void`; the in-memory and localStorage adapters now emit `null` when the underlying store is cleared (previously they emitted `'system'`, which was a fabricated value). The controller treats `null` as "external clear" and applies the configured default with `source: 'storage'`. The `#lastWritten` echo marker now uses `undefined` as the "no pending echo" sentinel so legitimate cross-tab clears are no longer mistaken for self-echoes after `reset()`.

Break the `events.ts ↔ types.ts` import cycle. `ThemeState`, `ThemeChangeSource`, and `ThemeChangeDetail` now live in `types.ts` (where the manager interface references them); `events.ts` owns the `ThemeEvents` event map and the `ThemeListener` alias.

Move `buildDomOptions` from `controller.ts` to `internal/dom-strategy/options.ts` (it configures strategies, lives next to them). Extract `defaultDomTarget` to `internal/dom-strategy/default-target.ts` (was duplicated in `class.ts` and `attribute.ts`). Inline `createThemeStore` in `plugin.ts` — drop the `as ThemeStore` cast and the `seedStoreFields` / `bindStoreCommands` / `syncFromManager` helpers.

Reorder `index.ts` exports by domain. `destroy()` order is now `super.destroy()` first (runs registered cleanups against a live lifecycle), then `this.#dom.destroy()`. The `Extract<ThemeChangeSource, ...>` inline type on `applySet` becomes a named `ApplySetSource` alias. `localStorage` private helpers (`readLocalStorage`, `writeLocalStorage`, `removeLocalStorage`, `subscribeLocalStorage`) are no longer exported.