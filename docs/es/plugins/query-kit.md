---
title: "Query Kit"
description: "Caché de consultas con adaptador Nanostores — el stack headless de queries recomendado para Alpine."
---

Package: `@ailuracode/alpine-query-kit`

Caché de consultas con adaptador Nanostores — el stack headless de queries recomendado para Alpine.

Reexporta todo desde `@ailuracode/alpine-query` (núcleo de caché) más:

- **Adaptador Nanostores** — `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`
- **Directivas** — `directivePlugin`, `magicPlugin`, `modelDirectivePlugin`

Query Devtools (panel de desarrollo con estilos) se publica desde un subpath aparte:
`@ailuracode/alpine-query-kit/devtools`.

## Instalación

```bash
pnpm add @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Inicio rápido

```ts
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

Registra `$store.query` y `@nanostores/alpine` (`x-nano`, `$nano`). Los devtools **no** se incluyen — impórtalos por separado cuando hagan falta.

## Devtools (desarrollo)

Importa devtools desde el subpath dedicado para que los bundles de producción permanezcan headless:

```ts
import queryKit from "@ailuracode/alpine-query-kit";
import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKit());
Alpine.plugin(
  queryDevtoolsPlugin({
    position: "bottom",
    toggleCorner: "bottom-right",
    theme: "system", // sigue `data-theme` del host, `.dark` o preferencia del sistema
  })
);
```

O registra ambos en un solo plugin:

```ts
import { queryKitWithDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKitWithDevtoolsPlugin({ devtools: { theme: "dark" } }));
```

Carga diferida en desarrollo:

```js
if (import.meta.env.DEV) {
  const { queryDevtoolsPlugin } = await import("@ailuracode/alpine-query-kit/devtools");
  Alpine.plugin(queryDevtoolsPlugin());
}
```

## Uso standalone (sin Alpine)

```ts
import { createAlpineNanostoresAdapter, nanostoresQueryAdapter } from "@ailuracode/alpine-query-kit";

// Usa el adaptador nanostores con un cliente de query personalizado
import { createQueryClient, query } from "@ailuracode/alpine-query";

const client = createQueryClient({ adapter: nanostoresQueryAdapter });
```

## API de Devtools (subpath `/devtools`)

| Export | Descripción |
|--------|-------------|
| `queryDevtoolsPlugin` | Factory del plugin solo para devtools |
| `queryKitWithDevtoolsPlugin` | Registra adaptador Nanostores + panel devtools |
| `mountQueryDevtools(options)` | Monta el panel devtools programáticamente |
| `getQueryStore()` | Accede a la instantánea fusionada del query store |
| `DEFAULT_PREFERENCES_STORAGE_KEY` | Clave de almacenamiento para preferencias del panel |
| `TOGGLE_CORNERS` | Posiciones de esquina del panel flotante |
| `DEFAULT_TOGGLE_CORNER` | Esquina predeterminada (`"bottom-right"`) |

### Comportamiento del tema

| Opción `theme` | Comportamiento |
|----------------|----------------|
| `"light"` | Fuerza chrome claro en devtools |
| `"dark"` | Fuerza chrome oscuro en devtools |
| `"system"` (predeterminado) | Sigue `data-theme` en `<html>`, luego `.dark` en `<html>`, luego `prefers-color-scheme` |

En modo `system` el panel observa `data-theme` / `class` en la raíz del documento y reacciona a cambios de media de esquema de color.

### Opciones de devtools

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `position` | `"bottom"` | Acoplamiento del panel: `"bottom"` o `"right"` |
| `toggleCorner` | `"bottom-right"` | Posición del toggle flotante |
| `persistToggleCorner` | `true` | Guarda la esquina del toggle en `localStorage` |
| `persistPreferences` | `true` | Guarda preferencias del panel |
| `followLatest` | `true` | Auto-selecciona la actividad de query más reciente |
| `initialOpen` | `false` | Abre el panel al cargar |
| `filter` | `""` | Cadena de filtro inicial |
| `theme` | `"system"` | Tema de color del panel |
| `storeName` | `"query"` | Nombre del store de Alpine a inspeccionar |
| `additionalStores` | — | Stores de query extra para fusionar en el panel |

## Reexportaciones desde `@ailuracode/alpine-query`

Todo del paquete núcleo se reexporta:

| Export | Descripción |
|--------|-------------|
| `createQueryClient` | Crea un cliente de query con un adaptador |
| `query` | Factory de query headless |
| `vanillaQueryAdapter` | Adaptador vanilla JS (sin reactividad) |
| `QueryStore` | Query store para integración con devtools |

## Módulos incluidos

| Módulo | Import | Descripción |
|--------|--------|-------------|
| Caché de query | `@ailuracode/alpine-query-kit` | Reexporta `@ailuracode/alpine-query` (`$store.query`, `queryKey`, …) |
| Adaptador Nanostores | `@ailuracode/alpine-query-kit` | `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`, `NanoStores` |
| Devtools | `@ailuracode/alpine-query-kit/devtools` | Panel inspector con estilos (solo desarrollo) |

Para configuraciones solo Alpine/Zustand sin Nanostores, usa [`@ailuracode/alpine-query`](../query.md) con [`query-adapter-alpine`](../query.md) o [`query-adapter-zustand`](../query.md).

## Solo adaptador Nanostores

```js
import query, { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-kit";

Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
```

O registra `$nano` sin el query store:

```js
import { NanoStores } from "@ailuracode/alpine-query-kit";

Alpine.plugin(NanoStores);
```

## Exports

APIs headless (entrada principal):

```js
import queryKit, {
  queryKey,
  nanostoresQueryAdapter,
  createAlpineNanostoresAdapter,
  nanostoresQueryPlugin,
} from "@ailuracode/alpine-query-kit";
```

APIs de devtools (subpath):

```js
import {
  queryDevtoolsPlugin,
  queryKitWithDevtoolsPlugin,
  mountQueryDevtools,
} from "@ailuracode/alpine-query-kit/devtools";
```

Consulta [Query cache](../query.md) para opciones de fetch, mutaciones y autoría de adaptadores.
