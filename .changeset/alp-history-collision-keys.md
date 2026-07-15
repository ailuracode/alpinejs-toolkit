---
"@ailuracode/alpine-history": patch
---

`@ailuracode/alpine-history` plugin options now accept a `magicKey` so hosts with a pre-existing `$history` magic collision can move the integration surface without forking the controller. The new `DEFAULT_HISTORY_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now routes the magic through `guardMagic` (via `bridgeControllerStore`) with `packageName: "history"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `historyPlugin()` instead of the raw key. The previous inline `Alpine.magic("history", ...)` call has been removed in favor of the bridge. This unblocks `@ailuracode/alpine-history` from the `registrationGuardPending` migration list tracked by `architecture:check`.