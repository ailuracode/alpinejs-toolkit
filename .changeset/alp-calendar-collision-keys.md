---
"@ailuracode/alpine-calendar": patch
---

`@ailuracode/alpine-calendar` now accepts a `CreateCalendarPluginOptions` argument (added by this release) exposing `magicKey` so hosts with a pre-existing `$calendar` collision can move the integration surface without forking the controller. The new `DEFAULT_CALENDAR_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "calendar"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `calendarPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-calendar` from the `registrationGuardPending` migration list tracked by `architecture:check`.
