# @ailuracode/alpine-transfer

## 1.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 1.0.1

### Patch Changes

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-transfer` `TransferPluginOptions` now accepts `clipboardKey`, `shareKey`, and `exportKey` so hosts with pre-existing magic collisions can move any combination of the three integration surfaces without forking the helpers. The new `DEFAULT_TRANSFER_CLIPBOARD_KEY`, `DEFAULT_TRANSFER_SHARE_KEY`, and `DEFAULT_TRANSFER_EXPORT_KEY` constants keep the renames discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "transfer"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `transferPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-transfer` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
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
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- 531ed60: Unify browser environment and transfer plugins into single packages with inlined source.

  - **`@ailuracode/alpine-env`** — absorbs `network`, `battery`, `platform`, and `visibility`
  - **`@ailuracode/alpine-transfer`** — absorbs `clipboard`, `share`, and `export`

  Removed standalone packages: `@ailuracode/alpine-network`, `@ailuracode/alpine-battery`, `@ailuracode/alpine-platform`, `@ailuracode/alpine-visibility`, `@ailuracode/alpine-clipboard`, `@ailuracode/alpine-share`, `@ailuracode/alpine-export`, `@ailuracode/alpine-screen`.

  Migrate imports to `@ailuracode/alpine-env` or `@ailuracode/alpine-transfer`. `@ailuracode/alpine-notify` now uses platform helpers from `alpine-env`. `@ailuracode/alpine-attention` is limited to `$wakelock` and `$idle` (use `alpine-env` for `$visibility`).
