---
title: "Overlay"
description: "Raíz de portal centralizada, asignación de z-index y registro de overlays abiertos para Alpine.js."
---

Package: `@ailuracode/alpine-overlay`

Raíz de portal centralizada, asignación de slots z-index y registro de overlays abiertos para aplicaciones Alpine.js.

Headless. Sin Tailwind ni frameworks CSS. Sin mutación del DOM fuera de la raíz del portal.

## Instalación

```bash
pnpm add @ailuracode/alpine-overlay @ailuracode/alpine-core alpinejs
```

## Inicio rápido

```ts
import Alpine from "alpinejs";
import { overlayPlugin } from "@ailuracode/alpine-overlay";

Alpine.plugin(overlayPlugin({ baseZIndex: 1000, step: 10 }));

Alpine.start();
```

Plantilla:

```html
<template x-teleport="#overlay-root">
  <div class="dialog" :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'confirm') }">
    <!-- ... -->
  </div>
</template>
```

### Evitar colisiones de nombres

Si tu aplicación ya usa `$store.overlay` — o otro plugin del toolkit registra ese nombre — renombra la superficie de integración sin tocar el controller:

```ts
Alpine.plugin(overlayPlugin({ storeKey: "stack" })); // → $store.stack
```

La constante expuesta `DEFAULT_OVERLAY_STORE_KEY` mantiene el renombrado descubrible desde TypeScript.

## API

### `$store.overlay`

| Miembro | Tipo | Descripción |
|---|---|---|
| `stack` | `readonly OverlayStackEntry[]` | Overlays abiertos ordenados por z-index (el superior al final) |
| `count` | `number` | `stack.length` |
| `root` | `HTMLElement \| null` | Contenedor del portal (creado de forma perezosa) |
| `baseZIndex` | `number` | Slot inicial (predeterminado `1000`) |
| `step` | `number` | Separación entre slots (predeterminado `10`) |
| `configure(opts)` | `void` | Configuración idempotente. `root`, `baseZIndex`, `step`. |
| `register(plugin, id)` | `number` | Asigna un slot, devuelve zIndex |
| `unregister(plugin, id)` | `void` | Libera el slot (silencioso si es desconocido) |
| `zIndexOf(plugin, id)` | `number` | Busca el zIndex asignado (`0` tras destroy) |
| `isOpen(plugin, id)` | `boolean` | Si `(plugin, id)` está en el stack |
| `on('change', cb)` | `Unsubscribe` | Suscripción a transiciones del stack |

### Magia `$overlay`

Atajo para `$store.overlay`. Misma forma.
