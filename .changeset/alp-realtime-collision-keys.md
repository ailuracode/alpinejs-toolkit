---
"@ailuracode/alpine-realtime": patch
---

`@ailuracode/alpine-realtime` `RealtimeControllerConfig` now accepts a `magicKey` so hosts with a pre-existing `$realtime` collision can move the integration surface without forking the controller or transport adapter. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "realtime"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `realtimePlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-realtime` from the `registrationGuardPending` migration list tracked by `architecture:check`.