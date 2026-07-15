---
"@ailuracode/alpine-permissions": patch
---

`@ailuracode/alpine-permissions` now exposes `storeKey` and `magicKey` on `PermissionsPluginOptions` so hosts with a pre-existing `$store.permissions` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_PERMISSIONS_STORE_KEY` / `DEFAULT_PERMISSIONS_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "permissions"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `permissionsPlugin()` instead of the raw key. Controller event-bus unsubscribe (`change`) is now bundled through the bridge's subscription cleanup so the reactive registry no longer leaks listeners on plugin destroy. This unblocks `@ailuracode/alpine-permissions` from the `registrationGuardPending` migration list tracked by `architecture:check`.
