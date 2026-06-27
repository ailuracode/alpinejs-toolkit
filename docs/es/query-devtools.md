---
title: "Query devtools"
description: "Panel de devtools del navegador para inspeccionar entradas de caché, flags de estado y mutaciones de @ailuracode/alpinejs-query."
---

Panel de devtools del navegador para inspeccionar entradas de caché, flags de estado y mutaciones de `@ailuracode/alpinejs-query`.

## Instalación

```bash
npm install @ailuracode/alpinejs-query-devtools @ailuracode/alpinejs-query @ailuracode/alpinejs-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpinejs-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpinejs-query-adapter-nanostores";

import queryDevtools from "@ailuracode/alpinejs-query-devtools";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.plugin(queryDevtools());
Alpine.start();
```

Consulta el [README del paquete](../packages/query-devtools/README.md) para opciones y montaje imperativo.

## Compatibilidad

Las devtools consumen la API headless `$store.query.devtools` (`subscribe`, `getSnapshot`) y los métodos del store `get`, `invalidate` y `remove`. Funcionan con cualquier query adapter plugin:

- **Plugin Alpine** — registra un query adapter plugin, luego `queryDevtools()`; el panel resuelve `$store.query` en `alpine:initialized`.
- **`createQueryClient()`** — pasa el cliente a `mountQueryDevtools({ store: getQueryStore(client) })` sin Alpine.

## Qué puedes inspeccionar

- Query keys y `data` serializada
- `status`, `fetchStatus`, `isLoading`, `isFetching`, `isStale`, conteo de observadores
- Opciones de query resueltas (`staleTime`, `gcTime`, `retry`, …)
- Variables, resultados y errores de mutaciones
- Actualizaciones en vivo vía `$store.query.devtools.subscribe()`
- Esquina del botón toggle (`top-left`, `top-right`, `bottom-left`, `bottom-right`) con persistencia en `localStorage`

## Producción

Carga las devtools solo en desarrollo:

```js
if (import.meta.env.DEV) {
  const { default: queryDevtools } = await import("@ailuracode/alpinejs-query-devtools");
  Alpine.plugin(queryDevtools());
}
```

## Ver también

- [@ailuracode/alpinejs-query](./query.md)
- [TanStack Query Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
