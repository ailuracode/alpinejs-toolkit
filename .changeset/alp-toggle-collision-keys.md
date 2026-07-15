---
"@ailuracode/alpine-toggle": patch
---

`@ailuracode/alpine-toggle` `CreateToggleOptions` now accepts a `magicKey` so hosts with a pre-existing `$toggle` collision can move the integration surface without forking the controller. The new `DEFAULT_TOGGLE_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "toggle"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `togglePlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-toggle` from the `registrationGuardPending` migration list tracked by `architecture:check`.