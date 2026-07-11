---
"@ailuracode/alpine-env": minor
---

Refactor `@ailuracode/alpine-env` around lifecycle-aware controllers.

- Add headless `EnvController` and `createEnv()` under `@ailuracode/alpine-env/controller`.
- Move browser subscriptions into `mount()` and make `destroy()` idempotent with listener cleanup.
- Prevent duplicate network / visibility / battery listeners on repeated plugin registration.
- Keep Alpine magics (`$network`, `$visibility`, `$battery`, `$platform`) while rewriting the root package as a thin reactive adapter.
- Keep the root entrypoint focused on Alpine integration so the package stays within its bundle budget.
