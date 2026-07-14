---
title: Query stack composition
description: Choose between the framework-agnostic query core, Alpine and Zustand adapters, and the recommended query kit bundle.
---

The Query Stack family layers a store-agnostic cache with pluggable reactivity adapters and an optional recommended bundle for Alpine apps.

## Package roles

| Package | Role | When to install |
|---------|------|-----------------|
| `@ailuracode/alpine-query` | Foundation | You need the cache engine only or a custom adapter |
| `@ailuracode/alpine-query-adapter-alpine` | Adapter | Native `Alpine.reactive` integration |
| `@ailuracode/alpine-query-adapter-zustand` | Adapter | Zustand vanilla stores bridged to Alpine |
| `@ailuracode/alpine-query-kit` | Bundle | **Recommended** for Alpine apps — core, Nanostores adapter, re-exports, and devtools entry |

The framework-neutral core does **not** require Alpine. Adapters and the kit add Alpine-friendly wiring on top.

## Recommended Alpine setup

```ts
import Alpine from "alpinejs";
import { queryKitPlugin } from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKitPlugin());
Alpine.start();
```

Use `query({ adapter })` from the kit re-export when you need explicit adapter control in examples or tests.

## Devtools

Query Devtools ship from `@ailuracode/alpine-query-kit/devtools` and are optional development tooling. Import the devtools entry only in development builds.

## Related demos

- [Query Stack family playground](/playground/data-networking/query-stack/)
- [Query core demo](/playground/query/)
- [Query kit demo](/playground/query-kit/)
