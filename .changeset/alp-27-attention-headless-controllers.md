---
"@ailuracode/alpine-attention": minor
---

Refactor `@ailuracode/alpine-attention` into headless controllers and a thin Alpine adapter.

- Add headless `WakeLockController`, `IdleController`, and composed `AttentionController` extending `BaseController`.
- Fix listener leaks: `visibilitychange` and permission-change listeners are now removable via `destroy()`.
- Add `mount()` idempotency to both controllers.
- Split package entry points: `.` (plugin only, 117 B) + `./controller` (headless + helpers).
- Extract shared browser detection into `browser.ts`, eliminating duplicate code across controllers and utils.
- Add `"sideEffects": false` for better tree-shaking.
- Shorten idle permission error messages for better gzip compression.
- Keep `registerAttentionMagic` as deprecated re-export in `./controller`.
