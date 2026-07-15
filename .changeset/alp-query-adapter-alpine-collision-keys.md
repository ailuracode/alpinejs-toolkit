---
"@ailuracode/alpine-query-adapter-alpine": patch
---

`@ailuracode/alpine-query-adapter-alpine` `QueryRegisterOptions` and the new `CreateQueryPluginOptions` accept a `storeKey` so hosts with a pre-existing `$store.query` collision can move the integration surface without forking the query cache. The new `DEFAULT_QUERY_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardStore` with `packageName: "query-adapter-alpine"` and `override: true, silent: true` (HMR/tests friendly) so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `queryPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-query-adapter-alpine` from the `registrationGuardPending` migration list tracked by `architecture:check`.