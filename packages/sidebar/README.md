# @ailuracode/alpinejs-sidebar

Alpine.js sidebar store for open/close state, overlay, keyboard navigation, and responsive breakpoints. Compose with `@ailuracode/alpinejs-scroll` for body scroll locking.

Three states: **open** (visible), **closed** (hidden), and **collapsed** (compact icon-only rail, optional).

**[Full documentation →](../../docs/plugins/sidebar.md)**

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

All visual changes (classes, attributes, transitions) are applied via callbacks — no CSS framework is assumed.

## Store API

Store name: `$store.sidebar`

### State

| Property | Type | Description |
|----------|------|-------------|
| `open` | `boolean` | Whether the sidebar is open |
| `collapsed` | `boolean` | Whether the sidebar is in collapsed (compact) mode |
| `matchesBreakpoint` | `boolean` | Whether the breakpoint query matches |

### Getters

| Getter | Description |
|--------|-------------|
| `isOpen` | Alias for `open` |
| `hasOverlay` | `true` when open and `closeOnOverlayClick` is enabled |

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
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `closeOnOverlayClick` | `boolean` | `true` | Close when overlay is clicked |
| `collapsed` | `boolean` | `false` | Start in collapsed (compact) mode |
| `breakpoint` | `string` | — | CSS media query for auto-close |
| `onOpen` | `() => void` | — | Called when sidebar opens |
| `onClose` | `() => void` | — | Called when sidebar closes |
| `onOverlayClick` | `() => void` | — | Called when overlay is clicked |
| `onCollapse` | `() => void` | — | Called when sidebar collapses to compact mode |
| `onExpand` | `() => void` | — | Called when sidebar expands from compact mode |

## HTML examples

### Basic sidebar with callbacks

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

### Sidebar with overlay

```html
<button @click="$store.sidebar.toggle()">Toggle sidebar</button>

<!-- Overlay -->
<div
  x-show="$store.sidebar.hasOverlay"
  x-transition.opacity
  @click="$store.sidebar.hide()"
  class="overlay"
></div>

<!-- Sidebar panel -->
<aside
  x-show="$store.sidebar.open"
  x-transition:enter="transition-slide-left"
  x-transition:leave="transition-slide-left-reverse"
>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  <button @click="$store.sidebar.hide()">Close</button>
</aside>
```

### With scroll lock integration

```js
import scroll from "@ailuracode/alpinejs-scroll";
import sidebar from "@ailuracode/alpinejs-sidebar";

Alpine.plugin(scroll());
Alpine.plugin(
  sidebar({
    onOpen() {
      Alpine.store("scroll").lock();
    },
    onClose() {
      Alpine.store("scroll").unlock();
    },
  }),
);
```

### With breakpoint auto-close

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
