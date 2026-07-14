---
title: "Accordion"
description: "Store headless de acordeón con modos single/multiple, paneles abiertos por defecto y ayudantes ARIA."
---

Package: `@ailuracode/alpine-accordion`

Store headless de acordeón con paneles en modo **single** o **multiple**, ítems **abiertos por defecto** opcionales, gestión de foco por teclado y ayudantes ARIA.

## Instalación

```bash
pnpm add @ailuracode/alpine-accordion alpinejs
```

El estado de paneles abiertos usa estado ligero inline — sin dependencia extra.

## Configuración

```js
import Alpine from "alpinejs";
import accordion from "@ailuracode/alpine-accordion";

Alpine.plugin(accordion());
Alpine.start();
```

## Store API

| Método | Descripción |
|--------|-------------|
| `register(accordionId, options?)` | Crea un grupo (`mode`, `defaultOpen`, `onChange`) |
| `registerItem(accordionId, itemId, disabled?)` | Registra un disparador de panel |
| `open(accordionId, itemId)` / `close` / `toggle` | Visibilidad del panel |
| `isOpen(accordionId, itemId)` | Si un panel está expandido |
| `openIds(accordionId)` | Array de ids de ítems abiertos |
| `activeItem(accordionId)` | Id del disparador con foco |
| `handleKeydown(accordionId, event)` | `ArrowUp`/`ArrowDown`/`Home`/`End` |
| `triggerProps(accordionId, itemId)` | `aria-expanded`, `aria-controls`, `tabindex` |
| `panelProps(accordionId, itemId)` | `role`, `aria-labelledby`, `aria-hidden` |

## Opciones

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `mode` | `'single'` | `'single'` cierra otros paneles al abrir uno; `'multiple'` permite varios abiertos |
| `defaultOpen` | — | Id o array de ids abiertos tras `registerItem` |
| `onChange` | — | `(openIds: string[]) => void` cuando cambia el estado abierto |

En modo **single**, solo se usa el **primer** id de `defaultOpen` cuando se pasa un array.

## Modo single

Solo un panel abierto a la vez.

```js
$store.accordion.register("faq", { mode: "single" });
["item-1", "item-2"].forEach((id) => $store.accordion.registerItem("faq", id));
```

```html
<div
  x-data
  x-init="
    $store.accordion.register('faq', { mode: 'single' });
    ['item-1','item-2'].forEach(id => $store.accordion.registerItem('faq', id));
  "
  @keydown="$store.accordion.handleKeydown('faq', $event)"
>
  <template x-for="id in ['item-1','item-2']" :key="id">
    <div>
      <button
        x-bind="$store.accordion.triggerProps('faq', id)"
        @click="$store.accordion.toggle('faq', id)"
        x-text="id"
      ></button>
      <div
        class="overflow-hidden"
        x-show="$store.accordion.isOpen('faq', id)"
        x-collapse
        x-bind="$store.accordion.panelProps('faq', id)"
      >
        <p class="px-4 py-3">Answer for <span x-text="id"></span></p>
      </div>
    </div>
  </template>
</div>
```

## Modo multiple

Varios paneles pueden permanecer abiertos.

```js
$store.accordion.register("settings", { mode: "multiple" });
["notifications", "privacy"].forEach((id) => $store.accordion.registerItem("settings", id));
```

```html
<div
  x-init="
    $store.accordion.register('settings', { mode: 'multiple' });
    ['notifications','privacy'].forEach(id => $store.accordion.registerItem('settings', id));
  "
>
  <!-- mismo marcado que en modo single -->
</div>
```

## Abierto por defecto

Pasa `defaultOpen` al registrar. Los paneles se abren automáticamente cuando se registra su ítem.

```js
// Single — un panel abierto al iniciar
$store.accordion.register("faq", {
  mode: "single",
  defaultOpen: "item-2",
});

// Multiple — varios paneles abiertos al iniciar
$store.accordion.register("settings", {
  mode: "multiple",
  defaultOpen: ["notifications", "integrations"],
});

["item-1", "item-2", "item-3"].forEach((id) => $store.accordion.registerItem("faq", id));
```

Lee los ids abiertos de forma reactiva:

```html
<span x-text="$store.accordion.openIds('faq').join(', ')"></span>
```

## Animación de paneles

`@ailuracode/alpine-accordion` es headless — no anima los paneles. Usa el plugin oficial [`@alpinejs/collapse`](https://alpinejs.dev/plugins/collapse): `x-collapse` debe estar en el **mismo elemento** que `x-show`.

```bash
pnpm add @alpinejs/collapse
```

```js
import collapse from "@alpinejs/collapse";

Alpine.plugin(collapse);
```

```html
<div
  x-show="$store.accordion.isOpen('faq', id)"
  x-collapse
  x-bind="$store.accordion.panelProps('faq', id)"
  class="overflow-hidden"
>
  <div class="px-4 py-3">Panel content</div>
</div>
```

Pon el padding en un **wrapper interno** — el padding vertical en el mismo nodo que `x-collapse` impide que la altura llegue a `0` y la animación de cierre puede quedar atascada.

Modificadores opcionales: `x-collapse.duration.300ms`, `x-collapse.min.50px`. Consulta la [documentación del plugin Collapse](https://alpinejs.dev/plugins/collapse).

`panelProps()` no establece `hidden` — la visibilidad la controla `x-show` en el cliente.

## SSR

Seguro cuando los paneles empiezan colapsados; la visibilidad se controla con `x-show` en el cliente. Usa `defaultOpen` solo cuando el marcado se hidrata en el cliente.
