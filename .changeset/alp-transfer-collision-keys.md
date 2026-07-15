---
"@ailuracode/alpine-transfer": patch
---

`@ailuracode/alpine-transfer` `TransferPluginOptions` now accepts `clipboardKey`, `shareKey`, and `exportKey` so hosts with pre-existing magic collisions can move any combination of the three integration surfaces without forking the helpers. The new `DEFAULT_TRANSFER_CLIPBOARD_KEY`, `DEFAULT_TRANSFER_SHARE_KEY`, and `DEFAULT_TRANSFER_EXPORT_KEY` constants keep the renames discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "transfer"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `transferPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-transfer` from the `registrationGuardPending` migration list tracked by `architecture:check`.