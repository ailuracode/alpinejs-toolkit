# @ailuracode/alpine-history

## 1.0.0

### Patch Changes

- Updated dependencies [9b88155]
- Updated dependencies [9b88155]
  - @ailuracode/alpine-core@0.3.0

## 0.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.0.1

### Patch Changes

- 9a44380: `@ailuracode/alpine-history` plugin options now accept a `magicKey` so hosts with a pre-existing `$history` magic collision can move the integration surface without forking the controller. The new `DEFAULT_HISTORY_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now routes the magic through `guardMagic` (via `bridgeControllerStore`) with `packageName: "history"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `historyPlugin()` instead of the raw key. The previous inline `Alpine.magic("history", ...)` call has been removed in favor of the bridge. This unblocks `@ailuracode/alpine-history` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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

## 0.0.0

### Patch Changes

- Initial release.
