---
title: "Collection"
description: "Primitivas de colección agnósticas al framework — filtrado, ordenación, agrupación, paginación y navegación por clave activa."
---

Package: `@ailuracode/alpine-collection`

Primitivas de colección agnósticas al framework para Alpine.js — filtrado, ordenación, agrupación, paginación y navegación por clave activa sobre un registro de claves estable.

## Instalación

```bash
pnpm add @ailuracode/alpine-collection
```

## Inicio rápido

```ts
import { createCollectionController } from "@ailuracode/alpine-collection";

type Item = { id: string; name: string; group: "fruit" | "veg" };

const collection = createCollectionController<Item>({
  items: [
    { id: "a", name: "Apple", group: "fruit" },
    { id: "b", name: "Banana", group: "fruit" },
    { id: "c", name: "Carrot", group: "veg" },
  ],
  getKey: (item) => item.id,
  isDisabled: (item) => item.id === "b",
  filter: { match: (item, query) => item.name.toLowerCase().includes(query) },
  sort: { compare: (a, b) => a.name.localeCompare(b.name) },
  group: { by: (item) => item.group },
});

collection.setFilter("ap");
collection.view; // [Apple] (Carrot filtrado, Banana deshabilitado + filtrado)
collection.setActiveKey("c");
collection.nextActiveKey(); // "a" (filtros + orden)
```

## Rol arquitectónico

`alpine-collection` es la **capa de estado derivado** debajo de paquetes como `@ailuracode/alpine-command`, `@ailuracode/alpine-menu` y cualquier consumidor que posea una lista con selección, navegación o paginación. Gestiona:

- Un **registro de ítems por clave estable** derivado de un array fuente.
- Un **pipeline** de etapas puras (`filter → sort → group → paginate`) cuyos resultados se memorizan por etapa y se exponen como vistas derivadas de solo lectura.
- **Navegación por ítem activo** que sobrevive a inserciones, eliminaciones y reordenamientos dinámicos.
- **Flags de ítems deshabilitados y ocultos** consultados por cada etapa para que ni la vista ni la navegación expongan ítems inalcanzables.

No incluye plugin Alpine ni dependencia dura de Alpine. El controller nunca toca `window`, `document` ni timers en su constructor.

## Qué NO es este paquete

| Responsabilidad | Pertenece a |
|---|---|
| Renderizar tablas, listas, árboles, listboxes | Capa UI del consumidor |
| Persistir o obtener datos remotos | `@ailuracode/alpine-query` |
| Poseer valores de selección | `@ailuracode/alpine-selection` |
| Virtualizar ventanas grandes | `@ailuracode/alpine-virtual` |
| Reactividad de gestión de estado | Alpine, Nanostores, Zustand (consumidores) |

## API del controller

```ts
const collection = createCollectionController<Item, Key>(options);
```

| Miembro | Tipo | Descripción |
|---|---|---|
| `view` | readonly getter | Ítems tras `filter → sort → group → paginate` como `ReadonlyArray`. |
| `groups` | readonly getter | `ReadonlyArray<CollectionGroup<T>>` cuando `group.by` está configurado. |
| `page` | readonly getter | Página actual (cuando `paginate.pageSize` está definido). |
| `pageCount` | readonly getter | Total de páginas. |
| `count` | readonly getter | `view.length`. |
| `source` | readonly getter | Array fuente original (snapshot congelado). |
| `keys` | readonly getter | Todas las claves registradas en orden de fuente. |
| `activeKey` | getter/setter | Ancla para `nextActiveKey` / `prevActiveKey`. |
| `query` | getter/setter | Consulta de filtro actual (`setFilter(value)` la actualiza). |
| `setItems(items)` | comando | Reemplaza el registro fuente. |
| `insert(item)` | comando | Añade un ítem. |
| `remove(key)` | comando | Elimina por clave. |
| `setFilter(query)` | comando | Actualiza el texto de filtro y recalcula. |
| `sort` | comando | Actualiza opciones de ordenación. |
| `group` | comando | Actualiza opciones de agrupación. |
| `paginate` | comando | Actualiza opciones de paginación. |
| `setPage(page)` | comando | Establece la página activa. |
| `nextActiveKey()` | comando | Avanza el activo (salta deshabilitados/ocultos, envuelve si `wrap`). |
| `prevActiveKey()` | comando | Retrocede el activo. |
| `firstActiveKey()` | comando | Primera clave seleccionable en la vista actual. |
| `lastActiveKey()` | comando | Última clave seleccionable en la vista actual. |
| `on(event, listener)` | evento | Escucha eventos `change` y `view`. |
| `destroy()` | comando | Teardown idempotente. |

## Opciones del plugin

```ts
export interface CollectionOptions<T, K extends string | number> {
  readonly items?: readonly T[];
  readonly getKey?: (item: T) => K;
  readonly initialKey?: K | null;
  readonly isDisabled?: (item: T) => boolean;
  readonly isHidden?: (item: T) => boolean;
  readonly filter?: CollectionFilterOptions<T>;
  readonly sort?: CollectionSortOptions<T>;
  readonly group?: CollectionGroupOptions<T>;
  readonly paginate?: CollectionPaginateOptions;
  readonly wrap?: boolean;
}
```

## Hoja de ruta

El plugin Alpine (`Alpine.store('collection', …)`, magia `$collection`) y un overlay de devtools están planificados en issues de Linear posteriores. Este paquete publica primero el controller para que los consumidores integren antes de que llegue la capa de plugin.
