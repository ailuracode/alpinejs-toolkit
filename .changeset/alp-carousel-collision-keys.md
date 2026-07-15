---
"@ailuracode/alpine-carousel": patch
---

`@ailuracode/alpine-carousel` `CreateCarouselOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.carousel` collision can move the integration surface without forking the controller. The new `DEFAULT_CAROUSEL_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "carousel"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `carouselPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-carousel` from the `registrationGuardPending` migration list tracked by `architecture:check`.