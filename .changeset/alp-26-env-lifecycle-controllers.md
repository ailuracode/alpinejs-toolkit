---
"@ailuracode/alpine-env": minor
---

Refactor `@ailuracode/alpine-env` around lifecycle-aware controllers.

- Add headless `NetworkController`, `VisibilityController`, `BatteryController`, and `PlatformController` exports backed by `@ailuracode/alpine-core`.
- Move browser subscriptions into `mount()` and make `destroy()` idempotent with listener cleanup.
- Prevent duplicate network / visibility / battery listeners on repeated plugin registration.
- Keep Alpine magics (`$network`, `$visibility`, `$battery`, `$platform`) while rewriting the plugin as a thin reactive adapter.
- Document the controller API and lifecycle behavior in the package README and plugin docs.
