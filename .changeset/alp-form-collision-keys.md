---
"@ailuracode/alpine-form": patch
---

`@ailuracode/alpine-form` now exposes `storeKey` and `magicKey` on `formPlugin(options)` so hosts with a pre-existing `$store.form` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_FORM_STORE_KEY` / `DEFAULT_FORM_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "form"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `formPlugin()` instead of the raw key. Controller event-bus unsubscribes (`change` / `submit` / `submit-error`) are now bundled through the bridge's subscription cleanup so the reactive registry no longer leaks listeners on plugin destroy. This unblocks `@ailuracode/alpine-form` from the `registrationGuardPending` migration list tracked by `architecture:check`.
