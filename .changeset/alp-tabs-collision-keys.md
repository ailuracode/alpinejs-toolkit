---
"@ailuracode/alpine-tabs": patch
---

`@ailuracode/alpine-tabs` now exposes `storeKey` and `magicKey` on `tabsPlugin(options)` so hosts with a pre-existing `$store.tabs` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_TABS_STORE_KEY` / `DEFAULT_TABS_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "tabs"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `tabsPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-tabs` from the `registrationGuardPending` migration list tracked by `architecture:check`.
