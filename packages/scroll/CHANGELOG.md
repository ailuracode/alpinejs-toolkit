# @ailuracode/alpine-scroll

## 1.0.0

### Major Changes

- **BREAKING**: Full v1.0.0 redesign — headless `ScrollController` + `ScrollPlugin` Alpine adapter.
- **BREAKING**: `$scroll` magic returns the `ScrollController` only (no callable surface, no `.store` / `.observer` / `.lockManager` bundle).
- **BREAKING**: Removed factory exports: `getScroll`, `createScrollObserver`, `createScrollController`, `createScrollLock`.
- **BREAKING**: Removed all `x-scroll-*` directives.
- **BREAKING**: Lock changes emit `controller.on('lock', detail)` (event name renamed from `'lock-change'`).
- **BREAKING**: Removed the `onLockChange` plugin callback option.
- New `ScrollController.lockWithHandle(reason: string): string` returns a handle for ordered, ref-counted locking.
- New `ScrollController.scrollIntoView({ x, y })` overload (absolute coordinates).
- New section observer (`registerSection` / `unregisterSection` / `activeSection` / `visibleSections`).
- New navigation surface: `by(delta, reason?)`, `toTop(reason?)`, `toBottom(reason?)`, `toElement(element, options?)`.
- New `--ailura-scrollbar-gap` compensation on lock (configurable via `reserveScrollbarGap: false`).
- Reduced-motion gate honors `prefers-reduced-motion` by default.

See `.agents/adr/0002-scroll-bundle-exception.md` for the bundle-size exception.

## 0.3.1

### Patch Changes

- Redesign `@ailuracode/alpine-screen` with configurable `ScreenInterval` breakpoints, `requestAnimationFrame` width updates, and typed `getDevice()` helper. Add new `@ailuracode/alpine-sidebar` store plugin. Export store types from geo, scroll, and theme. Add `zIndex` option to query devtools panel.

## 0.3.0

### Minor Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.2.0

### Minor Changes

- 65d2340: Migrate plugin source to TypeScript and publish compiled ESM from `dist/` with generated type declarations. Deep imports of `src/` paths are no longer supported; use the package root export.