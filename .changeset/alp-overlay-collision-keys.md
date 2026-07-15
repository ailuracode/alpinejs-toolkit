---
"@ailuracode/alpine-overlay": patch
---

`@ailuracode/alpine-overlay` `OverlayOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.overlay` collision can move the integration surface without forking the controller. The new `DEFAULT_OVERLAY_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "overlay"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `overlayPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-overlay` from the `registrationGuardPending` migration list tracked by `architecture:check`.