# @ailuracode/alpine-attention

## 1.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2
  - @ailuracode/alpine-permissions@0.0.2

## 1.1.0

### Minor Changes

- 04f1c20: Refactor `@ailuracode/alpine-attention` into headless controllers and a thin Alpine adapter.

  - Add headless `WakeLockController`, `IdleController`, and composed `AttentionController` extending `BaseController`.
  - Fix listener leaks: `visibilitychange` and permission-change listeners are now removable via `destroy()`.
  - Add `mount()` idempotency to both controllers.
  - Split package entry points: `.` (plugin only, 117 B) + `./controller` (headless + helpers).
  - Extract shared browser detection into `browser.ts`, eliminating duplicate code across controllers and utils.
  - Add `"sideEffects": false` for better tree-shaking.
  - Shorten idle permission error messages for better gzip compression.
  - Keep `registerAttentionMagic` as deprecated re-export in `./controller`.

### Patch Changes

- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-attention` now accepts a `CreateAttentionPluginOptions` argument exposing `wakelockKey` and `idleKey` so hosts with pre-existing magic collisions can move either integration surface without forking the underlying controllers. The new `DEFAULT_ATTENTION_WAKELOCK_KEY` and `DEFAULT_ATTENTION_IDLE_KEY` constants keep the renames discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "attention"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `attentionPlugin()` instead of the raw keys. The plugin retains a direct-Alpine overload for backwards compatibility. This unblocks `@ailuracode/alpine-attention` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- 2e786ee: Add `@ailuracode/alpine-permissions` with a unified adapter contract and migrate geolocation, notification, and idle detection permission handling to shared adapters.
- Updated dependencies [3c8b40f]
- Updated dependencies [1ae869c]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
- Updated dependencies [12ca21e]
- Updated dependencies [2e786ee]
  - @ailuracode/alpine-core@0.2.1
  - @ailuracode/alpine-permissions@0.0.1

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.2.0

### Minor Changes

- 531ed60: Unify browser environment and transfer plugins into single packages with inlined source.

  - **`@ailuracode/alpine-env`** — absorbs `network`, `battery`, `platform`, and `visibility`
  - **`@ailuracode/alpine-transfer`** — absorbs `clipboard`, `share`, and `export`

  Removed standalone packages: `@ailuracode/alpine-network`, `@ailuracode/alpine-battery`, `@ailuracode/alpine-platform`, `@ailuracode/alpine-visibility`, `@ailuracode/alpine-clipboard`, `@ailuracode/alpine-share`, `@ailuracode/alpine-export`, `@ailuracode/alpine-screen`.

  Migrate imports to `@ailuracode/alpine-env` or `@ailuracode/alpine-transfer`. `@ailuracode/alpine-notify` now uses platform helpers from `alpine-env`. `@ailuracode/alpine-attention` is limited to `$wakelock` and `$idle` (use `alpine-env` for `$visibility`).

## 0.1.1

### Patch Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.1.0

### Minor Changes

- 93bee23: Add `@ailuracode/alpine-attention` — Screen Wake Lock (`$wakelock`) and Idle Detection (`$idle`) magics.
