---
title: "Sidebar"
description: "Package: @ailuracode/alpinejs-sidebar"
---

Package: `@ailuracode/alpinejs-sidebar`

Controls sidebar open/close state with overlay, keyboard navigation, and responsive breakpoints. CSS-framework agnostic — all visual changes are applied via callbacks. Compose with `@ailuracode/alpinejs-scroll` for body scroll locking.

Three states: **open** (visible), **closed** (hidden), and **collapsed** (compact icon-only rail, optional).

## Install

```bash
npm install @ailuracode/alpinejs-sidebar alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import sidebar from "@ailuracode/alpinejs-sidebar";

Alpine.plugin(sidebar());
Alpine.start();
```

### With callbacks

Apply your own CSS classes or attributes when the sidebar state changes:

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

### With scroll lock

Compose with `@ailuracode/alpinejs-scroll` via callbacks to lock body scroll when the sidebar is open:

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

## Exported helpers

```js
import { sidebarOptions } from "@ailuracode/alpinejs-sidebar";
```

## Store API

Store name: `$store.sidebar`

### State

| Property | Type | Description |
|----------|------|-------------|
| `open` | `boolean` | Whether the sidebar is currently open |
| `collapsed` | `boolean` | Whether the sidebar is in collapsed (compact) mode |
| `matchesBreakpoint` | `boolean` | Whether the breakpoint media query currently matches |

### Getters

| Getter | Description |
|--------|-------------|
| `isOpen` | Alias for `open` |
| `hasOverlay` | `true` when open and `closeOnOverlayClick` is enabled (default) |

### Methods

| Method | Description |
|--------|-------------|
| `show()` | Open the sidebar |
| `hide()` | Close the sidebar |
| `toggle()` | Toggle open/closed |
| `collapse()` | Collapse to compact mode (icon-only) |
| `expand()` | Expand from compact mode |
| `toggleCollapse()` | Toggle between collapsed and expanded |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `closeOnEscape` | `boolean` | `true` | Close sidebar on Escape key press |
| `closeOnOverlayClick` | `boolean` | `true` | Close sidebar when overlay is clicked |
| `collapsed` | `boolean` | `false` | Start in collapsed (compact) mode |
| `breakpoint` | `string` | — | CSS media query — auto-closes when it no longer matches |
| `onOpen` | `() => void` | — | Called when sidebar opens |
| `onClose` | `() => void` | — | Called when sidebar closes |
| `onOverlayClick` | `() => void` | — | Called when overlay is clicked |
| `onCollapse` | `() => void` | — | Called when sidebar collapses to compact mode |
| `onExpand` | `() => void` | — | Called when sidebar expands from compact mode |

## HTML examples

### Sidebar with overlay and transitions

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

### Responsive auto-close

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

When the viewport crosses the breakpoint, the sidebar auto-closes.

### Compact mode (desktop)

Collapse the sidebar to an icon-only rail on desktop, full panel on mobile:

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

## See also

- [Scroll](./scroll.md) — compose with `$store.scroll` for body scroll locking via callbacks
- [Theme](./theme.md) — similar factory plugin pattern with callbacks
