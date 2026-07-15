---
"@ailuracode/alpine-sidebar": patch
---

`@ailuracode/alpine-sidebar` `CreateSidebarOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.sidebar` collision can move the integration surface without forking the controller. The new `DEFAULT_SIDEBAR_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "sidebar"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `sidebarPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-sidebar` from the `registrationGuardPending` migration list tracked by `architecture:check`.