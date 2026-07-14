---
title: "Sidebar"
description: "Visibilidad del panel lateral con $store.sidebar."
---

Package: `@ailuracode/alpine-sidebar`

Controla la **visibilidad** del panel lateral (show / hide / toggle) con overlay, navegación por teclado y breakpoints responsivos. Agnóstico al framework CSS — todos los cambios visuales se aplican mediante callbacks. Compón con `@ailuracode/alpine-scroll` para bloquear el scroll del body.

El plugin es **headless** por diseño y no conoce el ancho, modo ni apariencia de tu sidebar. La representación visual (drawer, rail, mini, expandido, flotante, etc.) queda en manos del consumidor mediante estado local de Alpine.

## Instalación

```bash
pnpm install @ailuracode/alpine-sidebar alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import sidebar from "@ailuracode/alpine-sidebar";

Alpine.plugin(sidebar());
Alpine.start();
```

### Con callbacks

Aplica tus propias clases CSS o atributos cuando cambie la visibilidad de la barra lateral:

```js
Alpine.plugin(
  sidebar({
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

### Con bloqueo de scroll

Compón con `@ailuracode/alpine-scroll` mediante callbacks para bloquear el scroll del body cuando la barra lateral está visible:

```js
import scroll from "@ailuracode/alpine-scroll";
import sidebar from "@ailuracode/alpine-sidebar";

Alpine.plugin(scroll());
Alpine.plugin(
  sidebar({
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
      Alpine.store("scroll").lock();
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
      Alpine.store("scroll").unlock();
    },
  }),
);
```

## Helpers exportados

```js
import { sidebarOptions } from "@ailuracode/alpine-sidebar";
```

## Store API

Store name: `$store.sidebar`

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `visible` | `boolean` | Si la barra lateral está visible actualmente |
| `matchesBreakpoint` | `boolean` | Si la media query del breakpoint coincide actualmente |

### Getters

| Getter | Descripción |
|--------|-------------|
| `isVisible` | Alias de `visible` |
| `hasOverlay` | `true` cuando está visible y `closeOnOverlayClick` está habilitado (predeterminado) |

### Métodos

| Método | Descripción |
|--------|-------------|
| `show()` | Muestra la barra lateral |
| `hide()` | Oculta la barra lateral |
| `toggle()` | Alterna entre visible y oculta |

### Opciones

| Opción | Tipo | Predeterminado | Descripción |
|--------|------|---------|-------------|
| `closeOnEscape` | `boolean` | `true` | Oculta la barra lateral al pulsar Escape |
| `closeOnOverlayClick` | `boolean` | `true` | Oculta la barra lateral al hacer clic en el overlay |
| `breakpoint` | `string` | — | Media query CSS — se oculta automáticamente cuando deja de coincidir |
| `onShow` | `() => void` | — | Se llama cuando la barra lateral se vuelve visible |
| `onHide` | `() => void` | — | Se llama cuando la barra lateral se oculta |
| `onOverlayClick` | `() => void` | — | Se llama cuando se hace clic en el overlay |

## Ejemplos HTML

### Barra lateral con overlay y transiciones

```html
<div x-data>
  <button @click="$store.sidebar.toggle()">Toggle sidebar</button>

  <!-- Overlay -->
  <div
    x-show="$store.sidebar.hasOverlay"
    x-transition.opacity
    class="fixed inset-0 bg-black/50 z-40"
    @click="$store.sidebar.hide()"
  ></div>

  <!-- Sidebar panel -->
  <aside
    x-show="$store.sidebar.visible"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="-translate-x-full"
    x-transition:enter-end="translate-x-0"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="translate-x-0"
    x-transition:leave-end="-translate-x-full"
    class="fixed inset-y-0 left-0 z-50 w-64 bg-base-100 shadow-lg"
  >
    <nav class="p-4">
      <a href="/" class="block py-2">Home</a>
      <a href="/about" class="block py-2">About</a>
    </nav>
    <button @click="$store.sidebar.hide()" class="absolute top-4 right-4">✕</button>
  </aside>
</div>
```

### Cierre automático responsivo

```js
Alpine.plugin(
  sidebar({
    breakpoint: "(min-width: 1024px)",
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

Cuando el viewport cruza el breakpoint, la barra lateral se oculta automáticamente.

### El ancho visual es responsabilidad del consumidor

El plugin no rastrea ancho ni modo. Define tu propio estado visual en Alpine — por ejemplo, un panel de 16rem contra un rail de 4rem:

```html
<div x-data="{ expanded: true }">
  <button @click="expanded = !expanded">
    <span x-text="expanded ? 'Collapse' : 'Expand'"></span>
  </button>

  <aside
    x-show="$store.sidebar.visible"
    x-transition
    :class="expanded ? 'w-64' : 'w-16'"
  >
    <a href="/" x-show="expanded">Home</a>
    <a href="/about" x-show="expanded">About</a>
  </aside>
</div>
```

Puedes sustituir esto por cualquier otra estrategia — un atributo `data-mode`, un `x-data` separado para el rail, una implementación solo con CSS, o nada en absoluto.

## Ver también

- [Scroll](./scroll.md) — compón con `$store.scroll` para bloquear el scroll del body mediante callbacks
- [Theme](./theme.md) — patrón de plugin factory similar con callbacks
