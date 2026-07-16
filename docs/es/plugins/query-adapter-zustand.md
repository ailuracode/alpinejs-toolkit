---
title: "Query adapter (Zustand)"
description: "Adaptador Zustand vanilla para @ailuracode/alpine-query, con puente manual a Alpine.reactive."
---

Package: `@ailuracode/alpine-query-adapter-zustand`

Adaptador de store vanilla [Zustand](https://github.com/pmndrs/zustand) para [`@ailuracode/alpine-query`](/query/).

**No hay integración oficial zustand-alpine.** Este paquete usa la API vanilla `createStore` de Zustand y conecta las suscripciones a `Alpine.reactive`.

## Instalación

```bash
pnpm add @ailuracode/alpine-query-adapter-zustand @ailuracode/alpine-query alpinejs zustand
```

## Inicio rápido

```ts
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import { createAlpineZustandAdapter } from "@ailuracode/alpine-query-adapter-zustand";

Alpine.plugin(query({ adapter: createAlpineZustandAdapter }));
Alpine.start();
```

## Exportaciones

| Exportación | Descripción |
|--------|-------------|
| `zustandQueryAdapter` | Adaptador para `createQueryClient({ adapter })` |
| `createAlpineZustandAdapter` | Factory para `query({ adapter })` |
| `default` | Plugin de conveniencia que envuelve `query({ adapter })` |

## Nota de integración

Existen adaptadores de terceros de Zustand para React, Lit y Angular — pero no para Alpine.js. Este paquete conecta `store.subscribe()` → `Alpine.reactive`.
