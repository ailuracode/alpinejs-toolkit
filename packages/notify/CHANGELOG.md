# @ailuracode/alpine-notify

## 2.0.0

### Patch Changes

- Updated dependencies [9b88155]
- Updated dependencies [9b88155]
  - @ailuracode/alpine-core@0.3.0
  - @ailuracode/alpine-env@1.0.0
  - @ailuracode/alpine-permissions@1.0.0

## 1.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2
  - @ailuracode/alpine-env@0.2.1
  - @ailuracode/alpine-permissions@0.0.2

## 1.0.1

### Patch Changes

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-notify` `NotifyPluginOptions` now accepts a `magicKey` so hosts with a pre-existing `$notify` collision can move the integration surface without forking the controller. The new `DEFAULT_NOTIFY_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "notify"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `notifyPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-notify` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- 2e786ee: Add `@ailuracode/alpine-permissions` with a unified adapter contract and migrate geolocation, notification, and idle detection permission handling to shared adapters.
- Updated dependencies [3c8b40f]
- Updated dependencies [80b7b59]
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
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
- Updated dependencies [12ca21e]
- Updated dependencies [2e786ee]
  - @ailuracode/alpine-core@0.2.1
  - @ailuracode/alpine-env@0.2.0
  - @ailuracode/alpine-permissions@0.0.1

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.4.0

### Minor Changes

- 531ed60: Unify browser environment and transfer plugins into single packages with inlined source.

  - **`@ailuracode/alpine-env`** — absorbs `network`, `battery`, `platform`, and `visibility`
  - **`@ailuracode/alpine-transfer`** — absorbs `clipboard`, `share`, and `export`

  Removed standalone packages: `@ailuracode/alpine-network`, `@ailuracode/alpine-battery`, `@ailuracode/alpine-platform`, `@ailuracode/alpine-visibility`, `@ailuracode/alpine-clipboard`, `@ailuracode/alpine-share`, `@ailuracode/alpine-export`, `@ailuracode/alpine-screen`.

  Migrate imports to `@ailuracode/alpine-env` or `@ailuracode/alpine-transfer`. `@ailuracode/alpine-notify` now uses platform helpers from `alpine-env`. `@ailuracode/alpine-attention` is limited to `$wakelock` and `$idle` (use `alpine-env` for `$visibility`).

### Patch Changes

- Updated dependencies [531ed60]
  - @ailuracode/alpine-env@0.1.0

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
