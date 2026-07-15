---
"@ailuracode/alpine-keyboard": patch
---

`@ailuracode/alpine-keyboard` now exposes `storeKey` and `magicKey` on `KeyboardPluginOptions` so hosts with a pre-existing `$store.keyboard` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_KEYBOARD_STORE_KEY` / `DEFAULT_KEYBOARD_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "keyboard"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `keyboardPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-keyboard` from the `registrationGuardPending` migration list tracked by `architecture:check`.
