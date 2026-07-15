---
"@ailuracode/alpine-menu": patch
---

`@ailuracode/alpine-menu` `CreateMenuOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.menu` collision can move the integration surface without forking the controller. The new `DEFAULT_MENU_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "menu"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `menuPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-menu` from the `registrationGuardPending` migration list tracked by `architecture:check`.