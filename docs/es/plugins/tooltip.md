---
title: "Tooltip"
description: "Store headless de tooltips con retrasos de apertura/cierre, hover/focus y cierre con Escape."
---

Package: `@ailuracode/alpine-tooltip`

Store headless de tooltips. Disparadores por hover/focus, retrasos de apertura y cierre, y cierre con Escape. Combínalo con `@alpinejs/anchor` para el posicionamiento.

## Instalación

```bash
pnpm add @ailuracode/alpine-tooltip alpinejs
```

Posicionamiento (Floating UI vía Alpine):

```bash
pnpm add @alpinejs/anchor
```

## Configuración

```js
import Alpine from "alpinejs";
import tooltip from "@ailuracode/alpine-tooltip";

Alpine.plugin(tooltip());
Alpine.start();
```

## Store API

| Método | Descripción |
|--------|-------------|
| `open(id)` / `close(id)` / `toggle(id)` | Visibilidad |
| `isOpen(id)` | Estado abierto |
| `register(id, options?)` | Configura retrasos y callbacks del ciclo de vida |
| `showOnHover(id)` / `hideOnHover(id)` | Ayudantes de hover |
| `showOnFocus(id)` / `hideOnFocus(id)` | Ayudantes de focus |
| `handleKeydown(id, event)` | Cierre con Escape |

### Opciones por tooltip

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `openDelay` | `0` | ms antes de abrir en hover/focus |
| `closeDelay` | `0` | ms antes de cerrar en mouseleave/blur |
| `onOpen` / `onClose` | — | Callbacks del ciclo de vida |

## Arquitectura

`TooltipController` posee todo el estado mutable de los tooltips. El plugin de Alpine copia instantáneas en `$store.tooltip.instances` en cada evento `change`. Mutar las instantáneas del store directamente no cambia el estado del controller.

## Uso standalone (sin Alpine)

```ts
import {
  createTooltipController,
  createTooltipStore,
  createTooltipStoreFromController,
} from "@ailuracode/alpine-tooltip";

const controller = createTooltipController();
controller.register("help", { openDelay: 150 });
controller.open("help");

const store = createTooltipStore();
// o: createTooltipStoreFromController(controller)
```

| Controller API | Descripción |
|----------------|-------------|
| `hasInstance(id)` | Si un id de tooltip está registrado |
| `snapshotInstances()` | Copias superficiales de solo lectura para sincronización del adaptador |
| `isOpen(id)` | Consulta el estado abierto |

## Migración

| Eliminado / cambiado | Reemplazo |
|----------------------|-----------|
| getter `controller.instances` | `snapshotInstances()` o `hasInstance(id)` |
| `controller.toStore()` | `createTooltipStore()` o `createTooltipStoreFromController(controller)` |

## Marcado básico

```html
<div
  x-data
  x-init="$store.tooltip.register('help', { openDelay: 150 })"
  @keydown.window="$store.tooltip.isOpen('help') && $store.tooltip.handleKeydown('help', $event)"
>
  <button
    x-ref="helpAnchor"
    @mouseenter="$store.tooltip.showOnHover('help')"
    @mouseleave="$store.tooltip.hideOnHover('help')"
    @focus="$store.tooltip.showOnFocus('help')"
    @blur="$store.tooltip.hideOnFocus('help')"
    aria-describedby="help-tooltip"
  >
    Help
  </button>

  <template x-teleport="body">
    <div
      id="help-tooltip"
      x-show="$store.tooltip.isOpen('help')"
      x-anchor.top.fixed.offset.8="$refs.helpAnchor"
      role="tooltip"
      class="z-50"
    >
      Tooltip content
    </div>
  </template>
</div>
```

## SSR

Los retrasos requieren temporizadores en el cliente — inicializa en el cliente vía `x-init`.

## Limitaciones

- El posicionamiento es tu responsabilidad — usa `@alpinejs/anchor` (`x-anchor.*.fixed`) para flip, shift y seguimiento del scroll
- Usa `<template x-teleport="body">` + `x-anchor.fixed` cuando el nodo flotante esté dentro de ancestros con `overflow-hidden`
- Conecta `@keydown.window` mientras esté abierto para que Escape funcione cuando el foco permanece en el disparador
