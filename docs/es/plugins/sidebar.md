---
title: "Sidebar"
description: "Estado de paneles laterales con $store.sidebar."
---

Package: `@ailuracode/alpinejs-sidebar`

Controla el estado abierto/cerrado de la barra lateral con overlay, navegación por teclado y breakpoints responsivos. Agnóstico al framework CSS — todos los cambios visuales se aplican mediante callbacks. Compón con `@ailuracode/alpinejs-scroll` para bloquear el scroll del body.

Tres estados: **open** (visible), **closed** (oculta) y **collapsed** (rail compacto solo con iconos, opcional).

## Instalación

```bash
npm install @ailuracode/alpinejs-sidebar alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import sidebar from "@ailuracode/alpinejs-sidebar";

Alpine.plugin(sidebar());
Alpine.start();
```

### Con callbacks

Aplica tus propias clases CSS o atributos cuando cambie el estado de la barra lateral:

```js
Alpine.plugin(
  sidebar({
    onOpen() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onClose() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

### Con bloqueo de scroll

Compón con `@ailuracode/alpinejs-scroll` mediante callbacks para bloquear el scroll del body cuando la barra lateral está abierta:

```js
import scroll from "@ailuracode/alpinejs-scroll";
import sidebar from "@ailuracode/alpinejs-sidebar";

Alpine.plugin(scroll());
Alpine.plugin(
  sidebar({
    onOpen() {
      document.documentElement.setAttribute("data-sidebar", "");
      Alpine.store("scroll").lock();
    },
    onClose() {
      document.documentElement.removeAttribute("data-sidebar");
      Alpine.store("scroll").unlock();
    },
  }),
);
```

## Helpers exportados

```js
import { sidebarOptions } from "@ailuracode/alpinejs-sidebar";
```

## Store API

Store name: `$store.sidebar`

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `open` | `boolean` | Si la barra lateral está abierta actualmente |
| `collapsed` | `boolean` | Si la barra lateral está en modo compacto (collapsed) |
| `matchesBreakpoint` | `boolean` | Si la media query del breakpoint coincide actualmente |

### Getters

| Getter | Descripción |
|--------|-------------|
| `isOpen` | Alias de `open` |
| `hasOverlay` | `true` cuando está abierta y `closeOnOverlayClick` está habilitado (predeterminado) |

### Métodos

| Método | Descripción |
|--------|-------------|
| `show()` | Abre la barra lateral |
| `hide()` | Cierra la barra lateral |
| `toggle()` | Alterna abierto/cerrado |
| `collapse()` | Colapsa al modo compacto (solo iconos) |
| `expand()` | Expande desde el modo compacto |
| `toggleCollapse()` | Alterna entre colapsado y expandido |

### Opciones

| Opción | Tipo | Predeterminado | Descripción |
|--------|------|---------|-------------|
| `closeOnEscape` | `boolean` | `true` | Cierra la barra lateral al pulsar Escape |
| `closeOnOverlayClick` | `boolean` | `true` | Cierra la barra lateral al hacer clic en el overlay |
| `collapsed` | `boolean` | `false` | Inicia en modo compacto (collapsed) |
| `breakpoint` | `string` | — | Media query CSS — se cierra automáticamente cuando deja de coincidir |
| `onOpen` | `() => void` | — | Se llama cuando la barra lateral se abre |
| `onClose` | `() => void` | — | Se llama cuando la barra lateral se cierra |
| `onOverlayClick` | `() => void` | — | Se llama cuando se hace clic en el overlay |
| `onCollapse` | `() => void` | — | Se llama cuando la barra lateral se colapsa al modo compacto |
| `onExpand` | `() => void` | — | Se llama cuando la barra lateral se expande desde el modo compacto |

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
    x-show="$store.sidebar.open"
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
    onOpen() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onClose() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

Cuando el viewport cruza el breakpoint, la barra lateral se cierra automáticamente.

### Modo compacto (escritorio)

Colapsa la barra lateral a un rail solo con iconos en escritorio, panel completo en móvil:

```js
Alpine.plugin(
  sidebar({
    collapsed: false,
    onCollapse() {
      document.documentElement.setAttribute("data-sidebar-collapsed", "");
    },
    onExpand() {
      document.documentElement.removeAttribute("data-sidebar-collapsed");
    },
  }),
);
```

```html
<!-- Toggle compact mode -->
<button @click="$store.sidebar.toggleCollapse()">
  <span x-text="$store.sidebar.collapsed ? 'Expand' : 'Collapse'"></span>
</button>

<!-- Sidebar adapts via data attribute -->
<aside
  :class="$store.sidebar.collapsed ? 'w-16' : 'w-64'"
  x-transition
>
  <nav>
    <a href="/" x-show="!$store.sidebar.collapsed">Home</a>
    <a href="/about" x-show="!$store.sidebar.collapsed">About</a>
  </nav>
</aside>
```

## Ver también

- [Scroll](./scroll.md) — compón con `$store.scroll` para bloquear el scroll del body mediante callbacks
- [Theme](./theme.md) — patrón de plugin factory similar con callbacks
