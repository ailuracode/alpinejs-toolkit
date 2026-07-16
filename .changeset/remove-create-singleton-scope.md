---
"@ailuracode/alpine-core": minor
---

Trim the `@ailuracode/alpine-core` public surface to drop dead code paths
that were never executed at runtime.

**Removed**

- `createSingletonScope()` — no runtime caller; `SingletonScope = object`
  remains so consumers can pass any plain object literal as `scope`.
- `SingletonInitOptions.options` and the JSON-fingerprint / warning branch
  inside `createSingleton()`. No feature package passed an `options` field
  to `createSingleton`, so the fingerprint and the
  `"already exists in this scope with different options"` warning never
  fired. The `optionsFingerprint` field is gone from `SingletonRecord`.
- `RegistrationGuardOptions.silent` and the `warnOverride()` helper inside
  `registration.ts`. Every production caller (`bridgeControllerStore`,
  `bridgeControllerDirective`, `query-adapter-alpine`, `env/plugin`)
  passed `silent: true`, so the warn branch was never executed. The
  `Set warnedOverrides` and the corresponding `if (!options.silent)`
  guards in `guardStore` / `guardMagic` / `guardDirective` are gone.

**Migration**

Replace `createSingletonScope()` with a plain object literal:

```ts
import { createTheme } from "@ailuracode/alpine-theme";

const scopeA = {};
const themeA = createTheme({ scope: scopeA });
```

Drop any `silent: true` you were passing to `guardX` calls — the option
no longer exists. Drop any `options:` field you were passing to
`createSingleton` — it is no longer accepted.

**Behavioral notes**

- Registration guards no longer emit any console warning on override. The
  override path is still silent and re-registration succeeds; collisions
  without `override: true` still throw `RegistrationError` as before.
- Singletons no longer detect option drift. If a host calls
  `createSingleton("k", factory, { scope })` twice with different
  factories but the same scope, the first factory wins and the second
  factory is discarded (no warning).

**Note on `0.x` versioning**

`@ailuracode/alpine-core` is currently on the `0.x` line. Per semver,
breaking changes within `0.x` are signalled by a `minor` bump — this
release goes from `0.2.2` to `0.3.0`, not to `1.0.0`. Consumers using
`^0.2.x` will receive the update; consumers pinned to `0.2.2` will not.

**Unpublished versions**

The following `@ailuracode/alpine-core` versions were unpublished from
npm prior to this release and are no longer installable: **none** —
`0.2.1` and `0.2.2` are still on npm (their removal failed due to
active dependents). Pin directly to the new version if you need
deterministic resolution.
