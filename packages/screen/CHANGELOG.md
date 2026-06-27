# @ailuracode/alpinejs-screen

## 1.0.1

### Patch Changes

- 2476868: Fix `$store.device` reactivity in templates by routing `resize` and `matchMedia` listener updates through `Alpine.store("device")` instead of mutating the internal store object directly.

## 1.0.0

### Major Changes

- Redesign `@ailuracode/alpinejs-screen` with configurable `ScreenInterval` breakpoints, `requestAnimationFrame` width updates, and typed `getDevice()` helper. Add new `@ailuracode/alpinejs-sidebar` store plugin. Export store types from geo, scroll, and theme. Add `zIndex` option to query devtools panel.

## 0.2.1

### Patch Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpinejs-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.2.0

### Minor Changes

- 65d2340: Migrate plugin source to TypeScript and publish compiled ESM from `dist/` with generated type declarations. Deep imports of `src/` paths are no longer supported; use the package root export.
