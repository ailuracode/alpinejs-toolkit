---
title: "Query adapter (Alpine)"
description: "Adaptador nativo Alpine.reactive para @ailuracode/alpine-query."
---

Package: `@ailuracode/alpine-query-adapter-alpine`

Adaptador nativo [`Alpine.reactive`](https://alpinejs.dev) para [`@ailuracode/alpine-query`](/query/).

Sin librería de store externa. Ideal cuando querés la huella de dependencias más pequeña.

## Instalación

```bash
pnpm add @ailuracode/alpine-query-adapter-alpine @ailuracode/alpine-core alpinejs
```

## Inicio rápido

```ts
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";

Alpine.plugin(query({ adapter: createAlpineStoreAdapter }));
Alpine.start();
```

### Evitar colisiones de nombres

Si tu aplicación ya usa `$store.query` — o otro plugin del toolkit registra ese nombre — renombra la superficie de integración sin tocar la caché de queries:

```ts
Alpine.plugin(query({ adapter: createAlpineStoreAdapter, storeKey: "cache" })); // → $store.cache
```

La constante expuesta `DEFAULT_QUERY_STORE_KEY` mantiene el renombrado descubrible desde TypeScript.

## Exportaciones

| Exportación | Descripción |
|--------|-------------|
| `createAlpineStoreAdapter` | Factory para `query({ adapter })` |
| `alpineStoreQueryAdapter` | Alias de `createAlpineStoreAdapter` |
| `default` | Plugin de conveniencia que envuelve `query({ adapter })` |
| `DEFAULT_QUERY_STORE_KEY` | Clave predeterminada de `$store.query` |
| `CreateQueryPluginOptions` | Opciones aceptadas por `createQueryPlugin` |
| `QueryRegisterOptions` | Opciones aceptadas por `query({...})` |

## Nota de integración

No existe un paquete `@alpinejs/store` aparte — este adaptador usa los objetos reactivos nativos de Alpine directamente.
