---
title: "Dialog"
description: "Store headless de diálogos accesibles con focus trap, scroll lock y helpers ARIA."
---

Package: `@ailuracode/alpine-dialog`

Store headless de diálogos accesibles para Alpine.js — estado open/close, focus trap, integración de bloqueo de scroll y helpers ARIA. No incluye markup ni CSS.

## Instalación

```bash
pnpm add @ailuracode/alpine-dialog alpinejs
```

## Configuración

```ts
import Alpine from "alpinejs";
import { dialogPlugin } from "@ailuracode/alpine-dialog";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(scrollPlugin());
Alpine.plugin(
  dialogPlugin({
    scroll: Alpine.store("scroll"),
  })
);
Alpine.start();
```

## Store API

```ts
// Open / close / toggle
$store.dialog.open("settings");
$store.dialog.close("settings");
$store.dialog.toggle("settings");
$store.dialog.isOpen("settings");

// Register / unregister instances
$store.dialog.register("confirm", { closeOnEscape: true, scrollLock: true });
$store.dialog.unregister("confirm");

// Accessibility helpers
$store.dialog.bindContainer("settings", containerEl);
$store.dialog.handleKeydown("settings", event);
$store.dialog.handleOutsideClick("settings", event);
$store.dialog.dialogProps("settings");
// → { role: "dialog", "aria-modal": true, "aria-labelledby": ..., "aria-describedby": ... }

// Cleanup
$store.dialog.destroy();
```

## Opciones

```ts
dialogPlugin({
  id?: string,                    // identificador del controller
  closeOnEscape?: boolean,        // predeterminado: true
  closeOnOutsideClick?: boolean,  // predeterminado: true
  scrollLock?: boolean,           // predeterminado: true
  scroll?: ScrollStore,           // store opcional de @ailuracode/alpine-scroll
});
```

## Uso standalone (sin Alpine)

```ts
import { createDialogController } from "@ailuracode/alpine-dialog";

const controller = createDialogController({ scrollLock: true });
controller.register("my-dialog");
controller.open("my-dialog");
controller.isOpen("my-dialog"); // true
controller.close("my-dialog");
controller.destroy();
```

Usa `createDialogStore()` para un objeto con forma de store sin Alpine, o `createDialogStoreFromController(controller)` al conectar un adaptador personalizado.

| Controller API | Descripción |
|----------------|-------------|
| `hasInstance(id)` | Si un id de diálogo está registrado |
| `snapshotInstances()` | Copias shallow de solo lectura para sincronización del adaptador |
| `isOpen(id)` | Consulta el estado abierto |

El controller emite eventos `open`, `close` y `change`. El plugin de Alpine refleja snapshots en `$store.dialog.instances`.

## Arquitectura

`DialogController` posee todo el estado mutable. `$store.dialog.instances` es un espejo reactivo actualizado en `open`, `close` y `change`. Mutar snapshots del store directamente no cambia el estado del controller.

## Migración

| Eliminado / cambiado | Reemplazo |
|----------------------|-----------|
| getter `controller.instances` | `snapshotInstances()` o `hasInstance(id)` |
| `controller.toStore()` | `createDialogStore()` o `createDialogStoreFromController(controller)` |

## Markup básico

```html
<div
  x-data
  x-init="$store.dialog.register('settings')"
  @keydown.window="$store.dialog.handleKeydown('settings', $event)"
>
  <button @click="$store.dialog.open('settings', { trigger: $event.target })">
    Settings
  </button>

  <template x-teleport="body">
    <div
      x-show="$store.dialog.isOpen('settings')"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        x-bind="$store.dialog.dialogProps('settings')"
        x-init="$store.dialog.bindContainer('settings', $el)"
        @click.stop
      >
    <h2 id="settings-title">Settings</h2>
    <p id="settings-desc">Update your preferences.</p>
    <button @click="$store.dialog.close('settings')">Close</button>
    </div>
  </div>
  </template>
</div>
```

## Accesibilidad

- `role="dialog"` y `aria-modal="true"` mediante `dialogProps()`
- El focus trap se activa cuando el contenedor está vinculado y el diálogo se abre
- El foco se restaura al elemento disparador al cerrar
- Escape cierra cuando está habilitado

## SSR

El estado es en memoria. Protege bindings DOM (`bindContainer`, focus trap) detrás de `x-init` o wrappers solo cliente.

## Integración

- **Scroll** — pasa `$store.scroll` como `scroll`
- **Toast** — muestra toasts de confirmación tras acciones del diálogo en tu capa de UI (no es una dependencia requerida)

## Limitaciones

- El apilamiento/z-index lo gestiona el consumidor — envuelve modales en `<template x-teleport="body">` cuando estén dentro de ancestros `overflow-hidden` (`x-teleport` requiere una etiqueta `<template>` en Alpine 3)
- Un focus trap por id de diálogo; vincula el elemento raíz del panel del diálogo

## Ver también

- [Scroll](./scroll.md) — bloqueo de scroll del body
- [Toast](./toast.md) — feedback tras acciones del diálogo
- [Keyboard](./keyboard.md) — atajos con alcance modal
