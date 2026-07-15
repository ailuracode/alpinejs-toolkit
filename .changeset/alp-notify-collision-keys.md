---
"@ailuracode/alpine-notify": patch
---

`@ailuracode/alpine-notify` `NotifyPluginOptions` now accepts a `magicKey` so hosts with a pre-existing `$notify` collision can move the integration surface without forking the controller. The new `DEFAULT_NOTIFY_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "notify"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `notifyPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-notify` from the `registrationGuardPending` migration list tracked by `architecture:check`.