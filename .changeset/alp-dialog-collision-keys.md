---
"@ailuracode/alpine-dialog": patch
---

`@ailuracode/alpine-dialog` `CreateDialogOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.dialog` collision can move the integration surface without forking the controller. The new `DEFAULT_DIALOG_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "dialog"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `dialogPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-dialog` from the `registrationGuardPending` migration list tracked by `architecture:check`.