---
"@ailuracode/alpine-ui": minor
---

Add `@ailuracode/alpine-ui` — a thin intermediate layer between `@ailuracode/alpine-core` and the feature packages in this monorepo that ships generic, framework-agnostic UI primitives.

- `createLocalStorageAdapter<Value>({ key, parse, serialize, crossTab? })` — SSR-safe `window.localStorage` adapter. Swallows `SecurityError` (Safari private mode, quota exceeded) and forwards cross-tab `storage` events filtered by key + parse. Exposes a no-op `subscribe` when `crossTab` is disabled so consumers can rely on the member existing.
- `createMemoryAdapter<Value>({ initial? })` — hermetic in-process cell with pub/sub for tests + SSR seeding. `remove()` emits `null` so consumers can distinguish "storage cleared" from "new value set".
- `createMediaQueryListener(query, listener)` — SSR-safe `matchMedia` subscription helper. Listener receives the raw `MediaQueryListEvent`. `Unsubscribe` is idempotent (re-callable without throwing) and falls back to a no-op when `matchMedia` is unavailable.
- `createPortalRoot({ id?, className?, as? })` — SSR-safe portal container factory. Returns the existing element when present, otherwise creates and appends a new one to `document.body`. Returns `null` under SSR so callers can short-circuit.

Both factories return a `SubscribableStorageAdapter<Value>` (the `subscribe` member is always present). `Unsubscribe` is re-exported for one-stop imports.

This package publishes no Alpine plugin and has no Alpine dependency — it is purely a set of primitives that feature packages compose.