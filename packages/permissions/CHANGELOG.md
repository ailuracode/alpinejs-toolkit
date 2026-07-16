# @ailuracode/alpine-permissions

## 0.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.0.1

### Patch Changes

- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-permissions` now exposes `storeKey` and `magicKey` on `PermissionsPluginOptions` so hosts with a pre-existing `$store.permissions` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_PERMISSIONS_STORE_KEY` / `DEFAULT_PERMISSIONS_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "permissions"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `permissionsPlugin()` instead of the raw key. Controller event-bus unsubscribe (`change`) is now bundled through the bridge's subscription cleanup so the reactive registry no longer leaks listeners on plugin destroy. This unblocks `@ailuracode/alpine-permissions` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 0.0.0

### Added

- Initial release with `PermissionsController`, adapter contract, and Alpine `$permissions` integration.
