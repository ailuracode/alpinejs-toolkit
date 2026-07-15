---
"@ailuracode/alpine-tooltip": patch
---

`@ailuracode/alpine-tooltip` `CreateTooltipOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.tooltip` collision can move the integration surface without forking the controller. The new `DEFAULT_TOOLTIP_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "tooltip"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `tooltipPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-tooltip` from the `registrationGuardPending` migration list tracked by `architecture:check`.