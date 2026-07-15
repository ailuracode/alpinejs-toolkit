---
"@ailuracode/alpine-scroll": patch
---

`@ailuracode/alpine-scroll` now exposes `storeKey` and `magicKey` on `scrollPlugin(options)` so hosts with a pre-existing `$store.scroll` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_SCROLL_STORE_KEY` / `DEFAULT_SCROLL_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration also passes `packageName: "scroll"` to `bridgeControllerStore` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `scrollPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-scroll` from the `registrationGuardPending` migration list tracked by `architecture:check`.
