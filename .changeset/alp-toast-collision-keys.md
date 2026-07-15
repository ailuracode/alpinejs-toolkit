---
"@ailuracode/alpine-toast": patch
---

`@ailuracode/alpine-toast` `ToastPluginOptions` now accepts a `magicKey` so hosts with a pre-existing `$toast` magic collision can move the integration surface without forking the controller. The new `TOAST_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "toast"` — replacing the previous direct `registerReactiveStore` + `registerStoreMagic` calls — so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `toastPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-toast` from the `registrationGuardPending` migration list tracked by `architecture:check`.