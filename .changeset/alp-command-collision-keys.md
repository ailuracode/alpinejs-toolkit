---
"@ailuracode/alpine-command": patch
---

`@ailuracode/alpine-command` now exposes `storeKey` and `magicKey` on `commandPlugin(options)` so hosts with a pre-existing `$store.command` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_COMMAND_STORE_KEY` / `DEFAULT_COMMAND_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "command"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `commandPlugin()` instead of the raw key. Controller event-bus unsubscribes (`open` / `close` / `change`) are now bundled through the bridge's subscription cleanup so the reactive store no longer leaks listeners on plugin destroy. This unblocks `@ailuracode/alpine-command` from the `registrationGuardPending` migration list tracked by `architecture:check`.
