---
"@ailuracode/alpine-scroll": major
---

# `@ailuracode/alpine-scroll` v1.0.0 — Headless controller + plugin adapter

The v0.x scroll plugin shipped a singleton + factory + four directives. v1.0.0
collapses every public surface onto one headless `ScrollController` and a
`ScrollPlugin` adapter class. The store / magic / observer / lock-manager
bundle is gone; `$scroll` returns the controller only.

## BREAKING CHANGES

1. **`$scroll` magic returns `ScrollController` only.** No `.store` /
   `.observer` / `.lockManager` bundle. Every command flows through the
   controller (`controller.by(...)`, `controller.lockWithHandle(...)`, etc.).
2. **Removed factory exports:** `getScroll`, `createScrollObserver`,
   `createScrollController`, `createScrollLock`. Consumers now use
   `new ScrollController(options)` directly.
3. **Removed all `x-scroll-*` directives.** Use `$store.scroll` /
   `$scroll` (magic) / `controller` directly.
4. **Lock event renamed** from `'lock-change'` to `'lock'`. The detail
   shape is now `ScrollLockChangeDetail` (canonical) — the old
   `ScrollLockDetail` alias is preserved for one release for soft
   migration.
5. **Removed `onLockChange` plugin callback.** Subscribe to
   `controller.on('lock', detail => ...)` instead.

## What's new

- `ScrollController.lockWithHandle(reason: string): string` returns a
  handle for ordered, ref-counted locking.
- `ScrollController.unlock(handle: string): void` releases a single
  handle.
- `ScrollController.scrollIntoView({ x, y })` overload (absolute
  coordinates, in addition to the existing `(Element, options?)`
  overload).
- Section observer: `registerSection(id, options?)` /
  `unregisterSection(id)` / `activeSection` / `visibleSections`.
- `--ailura-scrollbar-gap` compensation on lock (configurable via
  `reserveScrollbarGap: false`).
- Reduced-motion gate honors `prefers-reduced-motion` by default.
- Bundle exception documented in `docs/adr/0002-scroll-bundle-exception.md`.

## Migration

```diff
-import scroll from "@ailuracode/alpine-scroll";
-Alpine.plugin(scroll);
-Alpine.start();
+import { ScrollPlugin } from "@ailuracode/alpine-scroll";
+Alpine.plugin(ScrollPlugin.init({ id: "scroll" }));
+Alpine.start();
```

```diff
-$store.scroll.lock({ axis: "y" });
+$scroll.lockWithHandle("modal");
```

```diff
-controller.on("lock-change", (detail) => {});
+controller.on("lock", (detail) => {});
```