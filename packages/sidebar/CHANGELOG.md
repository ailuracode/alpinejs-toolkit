# @ailuracode/alpinejs-sidebar

## 0.1.1

### Patch Changes

- 2476868: Fix `$store.sidebar` reactivity in templates by routing `storage` and `resize` listener updates through `Alpine.store("sidebar")` instead of mutating the internal store object directly.

## 0.1.0

### Minor Changes

- Redesign `@ailuracode/alpinejs-screen` with configurable `ScreenInterval` breakpoints, `requestAnimationFrame` width updates, and typed `getDevice()` helper. Add new `@ailuracode/alpinejs-sidebar` store plugin. Export store types from geo, scroll, and theme. Add `zIndex` option to query devtools panel.
