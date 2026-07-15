---
"@ailuracode/alpine-lang": patch
---

`@ailuracode/alpine-lang` `LangPluginOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.lang` collision can move the integration surface without forking the controller. The new `DEFAULT_LANG_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "lang"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `langPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-lang` from the `registrationGuardPending` migration list tracked by `architecture:check`.