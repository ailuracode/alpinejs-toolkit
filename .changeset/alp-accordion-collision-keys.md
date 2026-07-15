---
"@ailuracode/alpine-accordion": patch
---

`@ailuracode/alpine-accordion` now exposes `storeKey` and `magicKey` on `accordionPlugin(options)` so hosts with a pre-existing `$store.accordion` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_ACCORDION_STORE_KEY` / `DEFAULT_ACCORDION_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "accordion"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `accordionPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-accordion` from the `registrationGuardPending` migration list tracked by `architecture:check`.
