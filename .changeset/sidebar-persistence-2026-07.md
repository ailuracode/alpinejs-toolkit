---
"@ailuracode/alpine-sidebar": minor
---

`@ailuracode/alpine-sidebar@2.1.0` — opt-in persistence for the sidebar `visible` boolean.

**New `SidebarStorage` interface and three built-in adapters:**

- `createLocalStorageSidebarStorage({ key?, crossTab? })` — persist to `window.localStorage` and sync across tabs via the `storage` event.
- `createMemorySidebarStorage(initial?)` — hermetic in-process adapter for tests and SSR.
- `persistSidebarVisible(Alpine, options?)` + `withSidebarVisiblePersist(store, options?)` — wire the sidebar's `visible` to Alpine's `@alpinejs/persist` helper.

**New `CreateSidebarOptions` fields:**

- `initial?: boolean` — SSR / cookie-injection seam. Renamed from `initialVisible` (TypeScript compile error for v2.0 callers passing the old name).
- `storage?: SidebarStorage` — explicit persistence adapter. Wins over `persistKey` when both are present (silent preference).
- `persistKey?: string` — convenience shortcut for `createLocalStorageSidebarStorage({ key })`.

**Cross-tab sync via the `storage` event.** Echo detection (`#lastWritten`) prevents same-tab feedback loops. `newValue: null` falls back to `initial`. Last-writer-wins per tab — documented limitation.

**New `SidebarChangeSource` value: `'storage'`.** Additive; no existing consumer code breaks. The discriminator is now a 6-value union.

**Persistence is opt-in.** Consumers who do not pass `storage` / `persistKey` see byte-identical behavior to v2.0.

**Cookie-bridge pattern documented** for SSR consumers using httpOnly cookies — the package does NOT implement httpOnly cookie support itself; the README + Starlight page show a custom `SidebarStorage` adapter that proxies to `fetch('/api/sidebar', { credentials: 'include' })`.
