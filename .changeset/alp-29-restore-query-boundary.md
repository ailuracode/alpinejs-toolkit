---
"@ailuracode/alpine-query": major
"@ailuracode/alpine-query-adapter-alpine": minor
"@ailuracode/alpine-query-kit": patch
"@ailuracode/alpine-query-adapter-zustand": patch
---

Restore the framework-agnostic boundary of `@ailuracode/alpine-query` by moving all Alpine-specific code into `@ailuracode/alpine-query-adapter-alpine`.

## Breaking changes (`@ailuracode/alpine-query`)

The following exports have been **removed** from `@ailuracode/alpine-query`:

- `query` (default export) — use `query` from `@ailuracode/alpine-query-adapter-alpine` instead
- `createQueryPlugin` — use from `@ailuracode/alpine-query-adapter-alpine`
- `createAlpineBridgedAdapter` — use from `@ailuracode/alpine-query-adapter-alpine`
- `bridgeQueryHandleToAlpine` — use from `@ailuracode/alpine-query-adapter-alpine`
- `bridgeMutationHandleToAlpine` — use from `@ailuracode/alpine-query-adapter-alpine`
- `QueryAdapterFactory` type — use from `@ailuracode/alpine-query-adapter-alpine`
- `QueryRegisterOptions` type — use from `@ailuracode/alpine-query-adapter-alpine`

The `alpinejs` peer dependency has been removed. `@ailuracode/alpine-query` can now be imported and used without Alpine installed at runtime.

## Migration

Replace Alpine-specific imports:

```diff
- import query from "@ailuracode/alpine-query";
+ import query from "@ailuracode/alpine-query-adapter-alpine";

- import { createAlpineBridgedAdapter } from "@ailuracode/alpine-query";
+ import { createAlpineBridgedAdapter } from "@ailuracode/alpine-query-adapter-alpine";
```

Framework-agnostic imports remain unchanged:

```ts
import { createQueryClient, vanillaQueryAdapter } from "@ailuracode/alpine-query";
```

## New exports (`@ailuracode/alpine-query-adapter-alpine`)

The adapter package now provides:

- `query` (default export) — Alpine.js query plugin factory
- `createQueryPlugin` — programmatic plugin creation
- `createAlpineBridgedAdapter` — wraps any adapter with Alpine.reactive bindings
- `bridgeQueryHandleToAlpine` / `bridgeMutationHandleToAlpine` — low-level bridge helpers
- `QueryAdapterFactory` / `QueryRegisterOptions` types
