---
"@ailuracode/alpine-theme": minor
---

`ThemeController` now composes a `ToggleController<'light', 'dark', 'system'>` from `@ailuracode/alpine-toggle` internally to model the three-value `current` state machine. Public API unchanged — every existing test passes against the new composition. Persistence, DOM application, system observation, and cross-tab synchronization continue to live on `ThemeController`. `@ailuracode/alpine-toggle@^0.3` is now a peer dependency.