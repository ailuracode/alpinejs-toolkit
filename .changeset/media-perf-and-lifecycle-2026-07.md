---
"@ailuracode/alpine-media": patch
---

Fix reactivity and lifecycle bugs in the Alpine integration:

- **Feature fields are now live on the reactive proxy.** `prefersReducedMotion`, `prefersContrast`, `prefersColorScheme`, `hover`, `pointer`, `orientation`, and `maxTouchPoints` were previously plain fields seeded once at plugin init; the change event handler never updated them, so `$store.media.prefersColorScheme` (and the rest) returned stale values after the user toggled dark mode. They are now getters that delegate to the controller — every Alpine render reads the live value. The viewport mirror (`width` / `height` / `breakpoint`) keeps its plain-field shape so the change handler can still trigger the proxy.

- **`mediaPlugin` now routes through the `createMedia()` singleton.** Re-running `Alpine.plugin(mediaPlugin())` returns the same controller instead of leaking a second `resize` listener and a second set of `matchMedia` subscriptions. `Alpine.cleanup` now also unsubscribes the bus listener before destroying the controller, so the slot releases cleanly on HMR / teardown.

- **`MediaController` constructor no longer touches `window` / `matchMedia`.** All `MediaQueryList` instances are allocated lazily during `mount()`, matching the SSR-safe contract declared in the controller's own docstring. `CachedFeatureMedia` is built once and captured by every `read()` closure, so `refresh()` and per-feature change events never re-invoke `window.matchMedia(...)`.

- **`#handleFeatureChange` reads only the feature that fired.** Previously a single `matchMedia` change ran `#syncFeatures()` and re-read all six features; it now reads exactly the changed one and emits only when the value moved.

- **`MEDIA_SINGLETON_KEY` is exported from the package root** so tests and advanced consumers can call `clearSingleton(MEDIA_SINGLETON_KEY)` without re-typing the key string. The per-package test setup resets the slot in `afterEach` so cases are independent of cleanup order.
