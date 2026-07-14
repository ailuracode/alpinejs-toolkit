---
title: "Virtual"
description: "Controller headless de listas virtuales para Alpine.js — cálculo de rango al estilo TanStack Virtual sin renderizar markup."
---

Package: `@ailuracode/alpine-virtual`

Controller headless de listas virtuales para Alpine.js — cálculo de rango al estilo TanStack Virtual sin renderizar markup.

## Instalación

```bash
pnpm add @ailuracode/alpine-virtual alpinejs @ailuracode/alpine-core
```

## Configuración

```ts
import Alpine from "alpinejs";
import virtual from "@ailuracode/alpine-virtual";

Alpine.plugin(virtual());
Alpine.start();
```

## Ejemplo rápido

```html
<div
  x-data="{ items: Array.from({ length: 10000 }, (_, i) => ({ id: i, label: `Row ${i}` })) }"
  x-init="
    $store.virtual.create('list', { count: items.length, estimateSize: 36, overscan: 4 });
    $nextTick(() => {
      const el = $el.querySelector('[data-virtual-scroll]');
      if (el) $store.virtual.bindScrollElement('list', el);
    });
  "
>
  <div
    data-virtual-scroll
    class="h-64 overflow-auto"
    x-bind="$store.virtual.listProps('list', { label: 'Virtual list' })"
  >
    <div x-bind="$store.virtual.contentProps('list')">
      <template x-for="item in $store.virtual.instances.list?.virtualItems ?? []" :key="item.key">
        <div
          x-bind="$store.virtual.itemProps('list', item.index)"
          class="absolute left-0 top-0 w-full"
          :style="`transform: translateY(${item.start}px); height: ${item.size}px`"
          x-text="items[item.index].label"
        ></div>
      </template>
    </div>
  </div>
</div>
```

## Store API

- `$store.virtual.create(id, options)` — registra una instancia de lista virtual
- `$store.virtual.bindScrollElement(id, element)` — adjunta el contenedor de scroll (o `window` cuando `scrollMode: 'window'`)
- `$store.virtual.instances[id].virtualItems` — ítems visibles con `start`, `end`, `size`, `key`
- `$store.virtual.measureItem(id, index, size)` — informa el tamaño medido para filas variables
- `$store.virtual.scrollToIndex(id, index, { align, behavior })` — scroll programático
- `$store.virtual.listProps` / `itemProps` / `contentProps` — ARIA headless + atributos de datos

## Controller API (sin Alpine)

```ts
import { createVirtualController } from "@ailuracode/alpine-virtual";

const controller = createVirtualController();
controller.create("logs", { count: 5000, estimateSize: 24 });
controller.on("rangeChange", ({ virtualItems }) => {
  render(virtualItems);
});
```

## Accesibilidad

Las filas fuera de pantalla no están en el DOM. No muevas el foco del teclado a ítems no montados — usa `scrollToIndex` para traer la fila activa al rango visible antes de enfocar.
