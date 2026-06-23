# @ailuracode/alpine-notify

## 0.3.2

### Patch Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.
- Updated dependencies [28938e3]
  - @ailuracode/alpine-platform@1.1.1

## 0.3.1

### Patch Changes

- 9fcf3ed: Reuse `@ailuracode/alpine-platform` for iOS and Android detection in mobile notification delivery.
- Updated dependencies [9fcf3ed]
  - @ailuracode/alpine-platform@1.1.0

## 0.3.0

### Minor Changes

- 7bcf30d: Add mobile notification support via service worker delivery, `sendAsync()` API, and iOS Home Screen install detection.

## 0.2.0

### Minor Changes

- 16f7f74: Add `@ailuracode/alpine-notify` — `$notify` magic for the Web Notifications API with graceful unsupported-browser and permission handling.

## 0.1.0

### Minor Changes

- Initial release: `$notify` magic for the Web Notifications API with graceful unsupported-browser handling
