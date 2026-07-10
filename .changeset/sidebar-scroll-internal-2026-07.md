---
"@ailuracode/alpine-scroll": minor
"@ailuracode/alpine-sidebar": minor
---

Sidebar now manages body scroll-lock internally via the new `scroll` option. The package gains `@ailuracode/alpine-scroll` as an optional peer dependency — install it (and call `scrollPlugin(...)` before `sidebarPlugin(...)`) only when this option is used.

**New API on `CreateSidebarOptions`:**

- `scroll?: ScrollStore` — when provided, the controller acquires a lock on user-driven `visible: true` transitions (`show()` / `toggle()` from user input) and releases it on the matching hide. The handle returned by `scroll.lock("sidebar")` is stored internally and passed back to `scroll.unlock(handle)` on release.
- `onVisibilityChange?: (visible: boolean, source: SidebarChangeSource) => void` — generic side-effect callback for DOM side effects (`data-sidebar` attribute, `scrollbar-gutter: stable`, focus management, A11y announcements). The plugin itself never touches the DOM. Source discriminator lets consumers filter.

**Behaviour:**

- Lock / unlock fire ONLY on `source: 'user'` transitions. Escape, breakpoint, reset, storage, and initialization changes do NOT touch the lock — matching the v2.0 demo wiring where only explicit user actions locked the scroll.
- A duplicate `show()` without a matching `hide()` does NOT acquire a second lock (idempotent).
- `hide()` without a held handle is a no-op (no throw).
- `destroy()` releases the held handle if any so the page does not stay locked when the sidebar is torn down without an explicit hide.

**Demo wiring** (`apps/demo/src/demo/plugin-registry.ts`):

```ts
Alpine.plugin(scrollPlugin({ id: "scroll", respectReducedMotion: true }));
Alpine.plugin(
  sidebarPlugin({
    closeOnEscape: true,
    breakpoint: { query: "(max-width: 1023px)", onMismatch: "hide" },
    scroll: Alpine.store("scroll"),
  }),
);
```

Order matters — the sidebar reads `Alpine.store("scroll")` at construction time, so the scroll plugin MUST run first. The two `Alpine.plugin()` calls keep the order explicit.

**Not breaking:**

- All existing `CreateSidebarOptions` fields keep their shape and defaults.
- `SidebarController` / `SidebarStore` / `SidebarManager` public surface is unchanged.
- Consumers that did not pass `scroll` see no behaviour change.