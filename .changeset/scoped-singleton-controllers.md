---
"@ailuracode/alpine-core": minor
"@ailuracode/alpine-theme": minor
"@ailuracode/alpine-media": minor
"@ailuracode/alpine-scroll": minor
"@ailuracode/alpine-sidebar": minor
"@ailuracode/alpine-lang": minor
"@ailuracode/alpine-overlay": minor
"@ailuracode/alpine-env": minor
"@ailuracode/alpine-toast": minor
---

Scope controller singletons to a document or explicit runtime context.

### `@ailuracode/alpine-core`

- Singleton registries are now keyed by `SingletonScope` (`document`, an explicit object from `createSingletonScope()`, or an ambient scope from `runWithSingletonScope()`).
- New exports: `createSingletonScope`, `runWithSingletonScope`, `resolveSingletonScope`, `releaseSingleton`, `SingletonScope`, `SingletonInitOptions`.
- `createSingleton` accepts an optional third argument for `scope` and options-conflict diagnostics (first configuration wins; later mismatches emit a `console.warn`).
- SSR without `document` must pass `scope` or wrap work in `runWithSingletonScope()` — otherwise factories throw `TOOLKIT_SINGLETON_SCOPE_REQUIRED`.

### Controller factories (`theme`, `media`, `scroll`, `sidebar`, `lang`, `overlay`, `toast`, `env`)

- Each `create*()` options object accepts an optional `scope?: SingletonScope`.
- `destroy()` releases only the slot for the scope the instance was created in.

### Migration

**Browser (unchanged for typical apps):** omit `scope` — the active `document` is used automatically.

**SSR / tests / multi-realm:**

```ts
import { createSingletonScope, runWithSingletonScope, createTheme } from "@ailuracode/alpine-core";

// Per-request scope (recommended)
const scope = createSingletonScope();
const theme = createTheme({ scope, defaultTheme: "dark" });

// Or ambient scope for a render pass
runWithSingletonScope(scope, () => {
  createTheme({ defaultTheme: "dark" });
});
```

**Conflicting options:** repeated `createTheme({ ... })` calls in the same scope with different options keep the first instance and warn on mismatch.
