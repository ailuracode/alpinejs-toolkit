# @ailuracode/alpine-attention

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
