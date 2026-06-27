# Query

Obtención asíncrona de datos al estilo TanStack Query para Alpine.js: caché, stale-while-revalidate, invalidación, reintentos, polling y mutaciones.

## Instalación

```bash
npm install @ailuracode/alpine-query @ailuracode/alpine-query-adapter-nanostores alpinejs nanostores @nanostores/alpine
```

## Inicio rápido

Elige un adaptador, pásalo a `query()` y registra el plugin. **Nanostores** es recomendado (`@nanostores/alpine` proporciona `x-nano` y `$nano`):

```js
import Alpine from "alpinejs";
import query from "@ailuracode/alpine-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpine-query-adapter-nanostores";

Alpine.plugin(NanoStores);
Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
Alpine.start();
```

Otros paquetes adaptador:

| Package | Backend |
|---------|---------|
| `@ailuracode/alpine-query-adapter-nanostores` | Nanostores + `@nanostores/alpine` (**recomendado**) |
| `@ailuracode/alpine-query-adapter-alpine` | `Alpine.reactive` nativo |
| `@ailuracode/alpine-query-adapter-zustand` | Zustand vanilla (puente manual; sin zustand-alpine oficial) |

### Sin Alpine

`createQueryClient()` expone la misma API sin registrar `$store.query`. El core de caché es **agnóstico al store** — pasa cualquier `QueryStateAdapter` o usa el default vanilla.

```js
import { createQueryClient, vanillaQueryAdapter } from "@ailuracode/alpine-query";
import { nanostoresQueryAdapter } from "@ailuracode/alpine-query-adapter-nanostores";

const query = createQueryClient({ adapter: nanostoresQueryAdapter });
const todos = query.observe(["todos"], fetchTodos);
```

```html
<div
  x-data="{
    todos: $store.query.observe(['todos'], () => typedFetch('/api/todos')),
  }"
>
  <p x-show="todos.isLoading">Loading…</p>
  <ul x-show="todos.isSuccess">
    <template x-for="todo in todos.data" :key="todo.id">
      <li x-text="todo.title"></li>
    </template>
  </ul>
</div>
```

Mantén el objeto query anidado (p. ej. `todos.isLoading`) — no hagas spread de `observe()` en `x-data`, o getters como `isSuccess` no funcionarán.

### Paginación

Usa el número de página en la query key para que cada página se cachee de forma independiente:

```html
<div
  x-data="{
    page: 1,
    pageSize: 12,
    query: null,
    loadPage() {
      this.query?.destroy?.();
      const page = this.page;
      this.query = $store.query.observe(
        ['pokemon', page],
        () =>
          typedFetch(
            `https://pokeapi.co/api/v2/pokemon?limit=${this.pageSize}&offset=${(page - 1) * this.pageSize}`
          ),
        { staleTime: 5 * 60_000 }
      );
    },
  }"
  x-init="loadPage()"
>
  <template x-if="query?.isSuccess">
    <ul>
      <template x-for="pokemon in query.data.results" :key="pokemon.name">
        <li x-text="pokemon.name"></li>
      </template>
    </ul>
  </template>
  <button type="button" @click="page--; loadPage()" x-bind:disabled="page <= 1">Previous</button>
  <button type="button" @click="page++; loadPage()" x-bind:disabled="!query?.data?.next">Next</button>
</div>
```

Volver a una página anterior sirve datos cacheados al instante mientras no haya expirado `staleTime`.

Consulta el [README del paquete](../packages/query/README.md) para la API completa.

## Adaptador personalizado

El motor de caché se comunica con tu librería de store mediante un **`QueryStateAdapter`**. Implementa esta interfaz para conectar cualquier runtime reactivo — Redux, Pinia, Solid signals, un bus de eventos personalizado, etc.

Todo adaptador debe exponer un string **`name`** (p. ej. `"Nanostores"`, `"Zustand"`). Las devtools de query lo muestran en el encabezado del panel (`Alpine Query · YourName`).

### Contrato

Cada query y mutación cacheada obtiene un **handle** con cuatro responsabilidades:

| Método | Rol |
|--------|------|
| `get()` | Snapshot del registro raw (`data`, `status`, `fetchStatus`, …) |
| `patch(partial)` | Aplica actualizaciones de caché desde el motor |
| `listen(listener)` | Notifica cuando cambia el registro; devuelve una función unsubscribe |
| `state` | Vista reactiva expuesta a consumidores (`observe()`, `mutate()`) |

Los registros de query usan `QueryStateRecord<TData>`; las mutaciones usan `MutationStateRecord<TData>`. El objeto `state` debe exponer getters para esos campos más flags booleanos (`isLoading`, `isSuccess`, …) y acciones (`refetch`, `mutate`, `reset`).

### Ejemplo mínimo (vanilla)

El `vanillaQueryAdapter` integrado es la referencia más simple — un objeto plano más un conjunto de listeners:

```js
import {
  createQueryClient,
  createMutationStateView,
  createQueryStateView,
  vanillaQueryAdapter,
  type QueryStateAdapter,
} from "@ailuracode/alpine-query";

// Use as-is for tests or non-reactive environments
const client = createQueryClient({ adapter: vanillaQueryAdapter });
```

Consulta [`packages/query/src/adapters/vanilla.ts`](../packages/query/src/adapters/vanilla.ts) para la implementación completa.

### Adaptador respaldado por store

Cuando tu librería ya posee estado reactivo (Zustand, Nanostores, MobX, …), mantén el **registro** en el store y construye la **vista** con helpers del core:

```js
import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateAdapter,
  type QueryStateRecord,
} from "@ailuracode/alpine-query";

export const myStoreAdapter: QueryStateAdapter = {
  name: "My Store",

  createQueryState(initial, staleTime, refetch) {
    const record = { ...initial }; // or your store's map/set API
    const state = createQueryStateView(() => record, staleTime, refetch);
    const listeners = new Set();

    return {
      state,
      get: () => record,
      patch: (patch) => {
        Object.assign(record, patch);
        listeners.forEach((l) => l(record));
      },
      listen: (listener) => {
        listeners.add(listener);
        listener(record);
        return () => listeners.delete(listener);
      },
    };
  },

  createMutationState(handlers) {
    const record = { data: undefined, error: null, status: "idle" };
    const state = createMutationStateView(() => record, handlers);
    const listeners = new Set();

    return {
      state,
      get: () => record,
      patch: (patch) => {
        Object.assign(record, patch);
        listeners.forEach((l) => l(record));
      },
      listen: (listener) => {
        listeners.add(listener);
        listener(record);
        return () => listeners.delete(listener);
      },
    };
  },
};
```

Conecta el `subscribe` / `listen` nativo del store en `listen` en lugar de un `Set` manual cuando esté disponible. Adaptadores existentes:

- [`query-adapter-nanostores`](../packages/query-adapter-nanostores/src/adapter.ts) — Nanostores `map()`
- [`query-adapter-zustand`](../packages/query-adapter-zustand/src/adapter.ts) — Zustand vanilla `createStore`

### Plugin Alpine desde un adaptador personalizado

Registra `$store.query` con `query({ adapter })`:

```js
import query from "@ailuracode/alpine-query";
import { myStoreAdapter } from "./my-store-adapter.js";

Alpine.plugin(query({ adapter: myStoreAdapter }));
Alpine.start();
```

Si el adaptador **no** está ya enlazado a plantillas Alpine, envuélvelo con `createAlpineBridgedAdapter`:

```js
import query, { createAlpineBridgedAdapter } from "@ailuracode/alpine-query";

Alpine.plugin(
  query({ adapter: (Alpine) => createAlpineBridgedAdapter(Alpine, myStoreAdapter) })
);
```

Para almacenamiento nativo con `Alpine.reactive`, usa [`createAlpineStoreAdapter`](../packages/query-adapter-alpine/src/adapter.ts) como referencia — llama a `attachQueryFlags` / `attachMutationFlags` directamente sobre el objeto reactivo.

### Factory de adaptador

`query({ adapter })` acepta una factory `(Alpine) => QueryStateAdapter` cuando el adaptador necesita la instancia de Alpine al registrar:

```js
query({ adapter: (Alpine) => createAlpineBridgedAdapter(Alpine, myStoreAdapter) });
```

### Publicar un paquete plugin

Los adaptadores oficiales son paquetes npm independientes (`@ailuracode/alpine-query-adapter-*`). Para publicar el tuyo:

1. Depende de `@ailuracode/alpine-query` y tu librería de store.
2. Exporta el adaptador; los consumidores llaman `query({ adapter })` desde `@ailuracode/alpine-query`.
3. Añade pruebas con `createQueryClient({ adapter })` y `startAlpine(query({ adapter }))`.

Solo **`patch` + `listen`** deben conectarse a tu store; el motor de caché gestiona fetch, reintentos, invalidación y GC.

## Conceptos

### Query keys

Los arrays identifican entradas cacheadas. Usa valores estables y serializables:

```js
['todos']
['todos', todoId]
['users', userId, 'posts']
```

### `observe()` vs `fetch()`

- **`observe()`** — para `x-data`. Se suscribe a la entrada de caché; llama `destroy()` cuando ya no necesites la suscripción (p. ej. paginación) para que las entradas puedan recolectarse.
- **`fetch()`** — fetch imperativo sin mantener suscripción.

### Stale time y garbage collection

- **`staleTime`** — cuánto tiempo los datos cacheados se tratan como frescos.
- **`gcTime`** — cuánto tiempo las entradas no usadas permanecen en memoria tras desconectar todos los observadores.

### Mutaciones

`$store.query.mutate()` devuelve un objeto de mutación reactivo con `mutate()`, `reset()` y getters de estado (`isPending`, `isSuccess`, …). Usa `invalidate()` en `onSuccess` para refrescar queries relacionadas.

### `fetch` tipado

Usa `typedFetch<T>()` dentro de callbacks `queryFn` en lugar de llamar al `fetch` nativo y castear `response.json()`:

```ts
import { typedFetch } from "@ailuracode/alpine-query";

type Todo = { id: number; title: string };

const todos = query.observe(["todos"], () => typedFetch<Todo[]>("/api/todos"));
```

`typedFetch` lanza `HttpError` (con el `Response` original) cuando el status no es OK. Pasa `fetcher` o `parse` en el segundo argumento para personalizar el comportamiento en pruebas o APIs no JSON.

## TypeScript

```ts
/// <reference types="@ailuracode/alpine-query/global" />
```

## Ver también

- [Arquitectura](./architecture.md)
- [Documentación de TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
