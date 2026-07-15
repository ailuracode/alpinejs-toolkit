---
"@ailuracode/alpine-virtual": patch
---

`@ailuracode/alpine-virtual` `CreateVirtualOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.virtual` collision can move the integration surface without forking the controller. The new `DEFAULT_VIRTUAL_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "virtual"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `virtualPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-virtual` from the `registrationGuardPending` migration list tracked by `architecture:check`.