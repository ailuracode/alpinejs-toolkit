---
"@ailuracode/alpine-media": patch
---

`@ailuracode/alpine-media` `CreateMediaOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.media` collision can move the integration surface without forking the controller. The new `DEFAULT_MEDIA_STORE_KEY` constant keeps the rename discoverable from TypeScript; `MEDIA_STORE_KEY` is retained as a deprecated alias for back-compat. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "media"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `mediaPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-media` from the `registrationGuardPending` migration list tracked by `architecture:check`.