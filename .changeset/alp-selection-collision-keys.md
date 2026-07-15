---
"@ailuracode/alpine-selection": patch
---

`@ailuracode/alpine-selection` `CreateSelectionOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.selection` collision can move the integration surface without forking the controller. The new `DEFAULT_SELECTION_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "selection"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `selectionPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-selection` from the `registrationGuardPending` migration list tracked by `architecture:check`.