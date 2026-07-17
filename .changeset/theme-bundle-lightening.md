---
"@ailuracode/alpine-theme": minor
---

Reduce the internal surface of `@ailuracode/alpine-theme` by ~39% (lines of source) and the gzipped bundle from `~1.87 kB` to **`1.76 kB`**. The package no longer hardcodes any framework-specific behavior — every consumer opts in to what they need.

### Removed public constants and helpers

These exports were never reused outside the package; the literal default lives in the only place that consumes it.

- `DEFAULT_THEME_PREFERENCE`, `DEFAULT_THEME_STORAGE_KEY`, `DEFAULT_THEME_STORE_KEY`, `DEFAULT_THEME_MAGIC_KEY` — defaults are still `"system"` / `"theme"` and are visible in each option's JSDoc.
- `ASTRO_REAPPLY_EVENTS` — replaced by passing the array directly to `themePlugin({ reapplyEvents })`.
- `LocalStorageThemeStorageOptions` — the option shape was `{ key?, crossTab? }`, inlined at the single call site.
- `readSystemTheme` — internal SSR helper, not part of the consumer contract.

### New: opt-in reapply events

`themePlugin()` previously registered listeners for `astro:after-swap` and `astro:page-load` unconditionally. Astro users now opt in explicitly; non-Astro consumers pay no cost for those strings.

```ts
import themePlugin from "@ailuracode/alpine-theme";

Alpine.plugin(themePlugin({
  reapplyEvents: ["astro:after-swap", "astro:page-load"],
}));
```

The same option covers any framework that swaps the document root (Turbo, View Transitions API, Next.js App Router, SvelteKit, etc.).

### Removed peer dependency

- `@ailuracode/alpine-toggle` — the `ThemeController` no longer composes a `ToggleController` to model the `current` state machine. `current` is now stored as a private `ThemePreference` field and `set` / `toggle` / `reset` mutate it directly.

`@ailuracode/alpine-ui` is **kept as a peer dependency** — the localStorage / in-memory / matchMedia helpers go through `createLocalStorageAdapter`, `createMemoryAdapter`, and `createMediaQueryListener` from `@ailuracode/alpine-ui`. Same observable behavior (SSR-safe, SecurityError-safe, cross-tab `storage` event wiring, idempotent media-query subscription).

### Removed public types

- `ThemeManager` — duplicate interface mirroring `ThemeController`. Use `ThemeController` instead.

### Internal simplifications (no consumer impact)

- **DOM strategy** — three separate classes (`ClassStrategy`, `AttributeStrategy`, `NoneStrategy`) and a discriminated union of option types collapse to a single `createDomHandle(options)` factory (~80 LOC saved). Same `class` / `attribute` / `none` strategies, same `darkClass` / `lightClass` / `attribute` / `target` options.
- **Events module** — `src/events.ts` (29 LOC) merges into `src/types.ts`. `ThemeEvents` and `ThemeListener` are still exported from the package root.
- **`isResolvedTheme` removed** from `internal/validation.ts` (unused — only `isThemePreference` was consumed by storage reads).
- **`applySet` removed** from `ThemeController` — the cross-tab path and `reset` now route through `set()` directly.
- **`ThemeAlpine.cleanup?` removed** — `bridgeControllerStore` (from `@ailuracode/alpine-core`) already wires `Alpine.cleanup` through `wireControllerLifecycle`.
- **Constructor purity restored** — `createDomHandle()` resolves the target element lazily on the first `apply()` call, so the controller's constructor no longer touches `document`.
- **`#handleCurrentChange` simplified** — removed redundant `readSystemTheme()` call (the system observer already keeps `#system` fresh).
- **`internal/browser.ts` removed** (single one-line helper inlined in `dom-strategy.ts`).

### Bundle metrics

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Source LOC | ~1,500 | ~920 | **−39%** |
| Source files | 17 | 9 | **−47%** |
| `dist/index.js` (raw) | 5.96 KB | 4.71 KB | **−21%** |
| `dist/index.d.ts` | 22.3 KB | 5.96 KB | **−73%** |
| Size-limit bundle (gzip, with deps) | 1.87 KB | 1.76 KB | **−6%** |
| Public exports | 19 | 11 | **−42%** |

### Migration

If your code only imports `themePlugin`, `createTheme`, `ThemeController`, `createLocalStorageThemeStorage`, `createMemoryThemeStorage`, or the type exports — **no action is required**.

If you previously relied on the implicit Astro listeners, add the option explicitly:

```ts
Alpine.plugin(themePlugin({
  reapplyEvents: ["astro:after-swap", "astro:page-load"],
}));
```

If your `package.json` declared `@ailuracode/alpine-toggle` purely as a transitive peer of theme, drop it. `alpine-ui` is still required. If your code uses `ThemeManager` as a type, switch to `ThemeController`.

### Tests

All 95 unit tests pass with the refactored implementation (initial state, transitions, subscribers, DOM strategies, system flips, cross-tab, SSR, singleton scopes, constructor purity, default vs opt-in reapply listeners).