---
"@ailuracode/alpine-child": patch
"@ailuracode/alpine-core": minor
---

`@ailuracode/alpine-child` `ChildPluginOptions` now accepts a `directiveKey` so hosts with a pre-existing `x-child` collision can move the integration surface without forking the unwrap pass. The new `DEFAULT_CHILD_DIRECTIVE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardDirective` with `packageName: "child"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `childPlugin()` instead of the raw key. `guardDirective` in `@ailuracode/alpine-core` now returns the Alpine-built directive chain so callers can attach priority modifiers (e.g. `.before("ignore")`) without re-registering. This unblocks `@ailuracode/alpine-child` from the `registrationGuardPending` migration list tracked by `architecture:check`.