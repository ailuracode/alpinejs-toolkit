# Toast

Package: `@ailuracode/alpine-toast`

Cola de toasts in-app headless para Alpine.js (sin markup ni CSS incluidos). Registra el magic `$toast` y un store reactivo interno para integradores de UI.

## Agnóstico al framework CSS

Este plugin **no incluye HTML, CSS ni design tokens**. Los nombres de variant y position **no están hardcodeados** — declaras los conjuntos que necesita tu UI. Los únicos conceptos integrados son:

- **`default`** — `$toast('Message')` o `{ variant: 'default' }`
- **`bottom-right`** — `position` predeterminada cuando se omite
- **`promise`** — `$toast.promise(factoryOrPromise, messages?)`

Mapea `toast.variant` y `toast.position` a layout/CSS en tu propio renderer (p. ej. `data-position`, clases Tailwind, coordenadas).

## Instalación

```bash
npm install @ailuracode/alpine-toast alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import toast, { toastOptions, toastPositions, toastVariants } from "@ailuracode/alpine-toast";

Alpine.plugin(
  toastOptions({
    variants: toastVariants(["success", "info", "warning", "error", "loading"] as const),
    positions: toastPositions(["top-center", "bottom-right"] as const),
    defaultPosition: "bottom-right",
    promise: {
      loadingVariant: "loading",
      successVariant: "success",
      errorVariant: "error",
    },
  })
);
Alpine.start();
```

`toastOptions()`, `toastVariants()` y `toastPositions()` preservan tipos literales para payloads fuertemente tipados y atajos `$toast.<variant>()`.

## Magic API

```js
$toast("Hello")
$toast({ title: "Saved", variant: "success", position: "top-center" })
$toast.success("Saved") // only when "success" is in `variants`
$toast.dismiss(id)
$toast.dismissAt("top-center")
$toast.dismissAll()
$toast.fromPayload({ title: "Done", variant: "success" })
await $toast.promise(() => save(), {
  loading: "Saving...",
  success: "Saved",
  error: "Could not save",
})
```

| Método | Descripción |
|--------|-------------|
| `$toast(title, options?)` | Encola un toast `default`. Devuelve el id del toast. |
| `$toast(payload)` | Encola con un objeto payload completo. |
| `$toast.<variant>(title, options?)` | Un atajo por cada entrada en `variants`. |
| `$toast.dismiss(id)` | Dispensa un toast por id (devuelto por `$toast()`). |
| `$toast.update(id, patch)` | Actualiza el mismo toast in situ (variant, title, content, action, …). |
| `$toast.dismissAt(position)` | Dispensa todos los toasts de una pila de posición. |
| `$toast.dismissAll()` | Dispensa todos los toasts de todas las pilas. |
| `$toast.pushUnique(key, payload?)` | Dispensa toasts activos con la misma `key`, luego encola. |
| `$toast.fromPayload(payload)` | Encola desde un payload plano (eventos, flash de Laravel, etc.). |
| `$toast.promise(factoryOrPromise, messages?)` | `loading` → `success` / `error` en el mismo toast. |

### Opciones del payload

| Campo | Tipo | Predeterminado |
|-------|------|---------|
| `content` | `TContent \| null` | `null` |
| `title` | `string \| null` | `null` |
| `description` | `string \| null` | `null` |
| `variant` | `default \| …your variants` | `default` |
| `position` | `bottom-right \| …your positions` | `bottom-right` (o `defaultPosition`) |
| `duration` | `number` (ms) | `4000` (`false` o `0` = sin auto-dismiss; se almacena como `false`) |
| `action` | `{ label, onClick? }` | `null` |
| `key` | `string \| null` | `null` — usa con `pushUnique` para toasts de un solo slot |

`title` / `description` son atajos de string opcionales. Usa `content` para cualquier forma que entienda tu renderer (objetos, arrays, fragmentos HTML, etc.). El plugin lo almacena tal cual — el renderizado depende de tu UI.

```ts
type AppToastContent = { user: { name: string; avatar: string } } | { html: string };

type Item = ToastItem<typeof variants, typeof positions, AppToastContent>;

$toast({
  content: { user: { name: "Ada", avatar: "/ada.png" } },
  variant: "success",
});
```

```html
<template x-for="toast in $store.toast.itemsAt(position)" :key="toast.id">
  <div x-show="toast.content?.user">
    <img :src="toast.content.user.avatar" alt="" />
    <span x-text="toast.content.user.name"></span>
  </div>
  <p x-show="toast.title" x-text="toast.title"></p>
</template>
```

Para `$toast.promise`, los opcionales `loadingContent`, `successContent` y `errorContent` actualizan el mismo elemento toast.

## Variants personalizados

```ts
import toast, { toastOptions, toastVariants, type ToastMagic } from "@ailuracode/alpine-toast";

const variants = toastVariants(["queued", "published", "failed"] as const);

Alpine.plugin(toast({ variants }));

type AppToast = ToastMagic<typeof variants>;
// AppToast has .queued(), .published(), .failed()
```

Sin `variants`, solo están disponibles `$toast()`, `$toast.promise()`, `$toast.dismiss()` y `$toast.fromPayload()`.

## Positions personalizadas

Cada posición declarada tiene **su propia pila**. `maxToasts` y `maxVisible` se aplican **por posición**, no globalmente.

```ts
import toast, { toastPositions, type ToastPosition } from "@ailuracode/alpine-toast";

const positions = toastPositions(["top-center", "bottom-right"] as const);

Alpine.plugin(
  toast({
    positions,
    defaultPosition: "bottom-right",
  })
);

type AppPosition = ToastPosition<typeof positions>;
// "bottom-right" | "top-center"
```

El plugin almacena el id de posición en cada toast. Renderiza una pila por posición en tu UI:

```html
<template x-for="position in $store.toast.stackPositions" :key="position">
  <div
    x-bind:data-position="position"
    x-bind:class="{
      'fixed top-4 left-1/2 -translate-x-1/2': position === 'top-center',
      'fixed bottom-4 right-4': position === 'bottom-right',
    }"
  >
    <template x-for="(toast, index) in $store.toast.itemsAt(position)" :key="toast.id">
      <div x-show="!toast.removed && $store.toast.isVisibleAt(position, index)">
        <p x-text="toast.title"></p>
      </div>
    </template>
  </div>
</template>
```

| Store API | Descripción |
|-----------|-------------|
| `stackPositions` | Todas las claves de pila (`defaultPosition` + `positions`) |
| `itemsAt(position)` | Toasts en esa pila, más recientes primero (incluye elementos con estado `removed`) |
| `timedItemsAt(position)` | Pila temporizada con auto-dismiss — mismo orden, incluye elementos con estado `removed` |
| `persistentItemsAt(position)` | Pila persistente (`duration: false`) — incluye elementos con estado `removed` |
| `activeTimedItemsAt(position)` | Pila temporizada sin elementos `removed` — preferida para `x-for` simple |
| `activePersistentItemsAt(position)` | Pila persistente sin elementos `removed` |
| `isVisibleAt(position, index)` | Solo pila temporizada — peek/limita visibilidad (`maxVisible`) |
| `pushUnique(key, payload?)` | Igual que `$toast.pushUnique` |
| `destroy()` | Limpia timers — llama al desmontar el plugin |
| `dismiss(id)` | Dispensa un toast (igual que `$toast.dismiss`) |
| `dismissAt(position)` | Dispensa una posición entera (temporizada + persistente) |
| `dismissAll()` | Dispensa todas las pilas |

## Flujo promise

Configura variants promise predeterminados en las opciones del plugin, o sobrescribe por llamada:

```js
Alpine.plugin(
  toast({
    variants: toastVariants(["loading", "success", "error"] as const),
    promise: {
      loading: "Loading...",
      error: "Something went wrong",
      loadingVariant: "loading",
      successVariant: "success",
      errorVariant: "error",
      duration: 4000,
    },
  })
);
```

```js
await $toast.promise(() => save(), {
  loading: "Saving...",
  success: (data) => `Saved ${data.id}`,
  error: "Could not save",
});
```

Si falta un variant con nombre en `variants`, los estados promise hacen fallback a `default`.

En caso de fallo, el toast se actualiza al estado de error y la promise devuelta **se rechaza** con el error original para que los llamadores sigan pudiendo usar `try/catch` o `.catch()`.

El estado **loading** usa una duración larga con temporizador (`PROMISE_LOADING_DURATION`) para permanecer en la **pila temporizada** (no perpetua). El timer se reemplaza cuando la promise se resuelve a success o error.

Los nombres de variant reservados (`dismiss`, `update`, `dismissAt`, `dismissAll`, `fromPayload`, `promise`) no pueden sobrescribir métodos core de `$toast`.

En plantillas Alpine, envuelve llamadas con varios argumentos en una función flecha:

```html
<button
  @click="() => $toast.promise(() => save(), { loading: 'Saving...', success: 'Saved!' })"
>
  Save
</button>
```

## Límites de cola

Cada **posición** tiene dos pilas independientes:

1. **Temporizada** — toasts con auto-dismiss (`duration > 0`). `maxVisible` se aplica aquí (UI peek/stack).
2. **Persistente** — `duration: false` (o `0` en payloads; normalizado a `false`). Siempre totalmente visible en tu UI.

`maxToasts` se aplica **por pila por posición** (no globalmente). Ejemplo: `maxToasts: 5` permite hasta 5 toasts temporizados + 5 persistentes en `bottom-right`.

| Opción | Predeterminado | Descripción |
|--------|---------|-------------|
| `maxToasts` | `5` | Máximo de toasts activos **por pila por posición**. `0` = ilimitado. |
| `maxVisible` | `maxToasts` | Máximo de toasts temporizados mostrados a la vez por posición (`isVisibleAt`). |

Usa `activeTimedItemsAt` / `activePersistentItemsAt` cuando tu renderer no necesite elementos con estado `removed`. Mantén `timedItemsAt` / `persistentItemsAt` cuando animes el dismiss (estilo Sonner).

## Eventos window

```js
window.dispatchEvent(
  new CustomEvent("toast", {
    detail: { title: "From anywhere", variant: "success", position: "top-center" },
  })
);
```

Desactiva con `toast({ listenToWindowEvents: false })`.

## Renderizar UI

```html
<template x-for="position in $store.toast.stackPositions" :key="position">
  <div
    role="region"
    x-bind:aria-label="'Toasts ' + position"
    x-bind:data-position="position"
  >
    <template x-for="(toast, index) in $store.toast.itemsAt(position)" :key="toast.id">
      <div
        role="status"
        x-show="!toast.removed && $store.toast.isVisibleAt(position, index)"
        x-bind:data-variant="toast.variant"
      >
        <p x-text="toast.title"></p>
      </div>
    </template>
  </div>
</template>
```

Estiliza `[data-variant="…"]` y `[data-position="…"]` en tu propio CSS o biblioteca de componentes.

## Opciones del plugin

```js
Alpine.plugin(
  toast({
    variants: toastVariants(["success", "error"] as const),
    positions: toastPositions(["top-center", "bottom-right"] as const),
    defaultPosition: "bottom-right",
    defaultDuration: 5000,
    maxToasts: 5,
    maxVisible: 3,
    listenToWindowEvents: true,
    storeKey: "toast",
    promise: {
      loadingVariant: "success",
      successVariant: "success",
      errorVariant: "error",
    },
  })
);
```

## Paquetes relacionados

- [`@ailuracode/alpine-notify`](./notify.md) — Web Notifications a nivel de SO (`$notify`)
