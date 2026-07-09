---
title: "Sidebar"
description: "Package: @ailuracode/alpine-sidebar"
---

Package: `@ailuracode/alpine-sidebar`

Controls sidebar **visibility** (show / hide / toggle) with overlay, keyboard navigation, and responsive breakpoints. CSS-framework agnostic — all visual changes are applied by your listeners. Compose with `@ailuracode/alpine-scroll` for body scroll locking.

The plugin is intentionally **headless** and does not know about the width, mode, or appearance of your sidebar. The visual representation (drawer, rail, mini, expanded, floating, etc.) is owned by the consumer via local Alpine state.

> **v2.0 is a breaking rewrite.** The plugin is now a thin adapter on top of a headless `SidebarController`. `onShow` / `onHide` plugin options are gone — subscribe to `controller.on('change', detail => …)` instead. `breakpoint` is now `{ query, onMismatch }` instead of a raw string. See the [Migration → v2.0](#migration-from-v10-to-v20) section below.

## Install

```bash
npm install @ailuracode/alpine-sidebar alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import { sidebarPlugin, createSidebar } from "@ailuracode/alpine-sidebar";

Alpine.plugin(sidebarPlugin());
Alpine.start();
```

For side effects (CSS classes, attributes, scroll lock, telemetry) subscribe to the typed `change` event:

```js
const controller = createSidebar();

controller.on("change", (detail) => {
  // detail: { visible, matchesBreakpoint, source, previous, event? }
  // source: 'user' | 'breakpoint' | 'escape' | 'reset' | 'initialization'
  if (detail.source !== "user") return;
  document.documentElement.toggleAttribute("data-sidebar", detail.visible);
});
```

## Controller API

The headless controller is exposed as a named export for advanced consumers that need typed event subscription outside of Alpine:

```js
import { createSidebar } from "@ailuracode/alpine-sidebar";

const controller = createSidebar({
  closeOnEscape: true,
  breakpoint: { query: "(min-width: 1024px)", onMismatch: "hide" },
  initialVisible: false,
});

controller.on("change", (detail) => {
  console.log(detail.visible, detail.source);
});
```

### Controller surface

| Member | Description |
|--------|-------------|
| `id` | Stable controller id (defaults to `sidebar-<n>`) |
| `visible` / `isVisible` | Current visibility (mirrors `$store.sidebar.visible`) |
| `matchesBreakpoint` | Last `MediaQueryListEvent.matches` value (`false` under SSR) |
| `hasOverlay` | `visible && closeOnOverlayClick` |
| `show()` / `hide()` / `toggle()` | User commands (emit `change` with `source: 'user'`) |
| `reset()` | Hide + restore initial breakpoint state (emits `source: 'reset'`) |
| `on('change', listener)` | Typed subscription; returns an `Unsubscribe` |
| `once('change', listener)` | One-shot subscription (auto-unsubscribes) |
| `off('change', listener)` | Detach a previously registered listener |
| `destroy()` | Idempotent; tears down listeners and the inner toggle |

## Store API

Store name: `$store.sidebar`

### State

| Property | Type | Description |
|----------|------|-------------|
| `visible` | `boolean` | Whether the sidebar is currently visible |
| `matchesBreakpoint` | `boolean` | Whether the breakpoint media query currently matches |

### Getters

| Getter | Description |
|--------|-------------|
| `isVisible` | Alias for `visible` |
| `hasOverlay` | `true` when visible and `closeOnOverlayClick` is enabled (default) |

### Methods

| Method | Description |
|--------|-------------|
| `show()` | Show the sidebar (emits `change` with `source: 'user'`) |
| `hide()` | Hide the sidebar (emits `change` with `source: 'user'`) |
| `toggle()` | Toggle visible/hidden (emits `change` with `source: 'user'`) |

## `change` event payload

```ts
interface SidebarChangeDetail {
  readonly visible: boolean;
  readonly matchesBreakpoint: boolean;
  readonly source: "user" | "breakpoint" | "escape" | "reset" | "initialization";
  readonly previous: { visible: boolean; matchesBreakpoint: boolean } | null;
  readonly event?: KeyboardEvent | MediaQueryListEvent; // escape | breakpoint only
}
```

### Source discriminator

| `source` | Trigger | Notes |
|----------|---------|-------|
| `'user'` | `show()` / `hide()` / `toggle()` | The most common case. Use this to react to direct user actions. |
| `'breakpoint'` | `matchMedia` `change` event | `detail.event` is the `MediaQueryListEvent`. Re-emitted on every flip. |
| `'escape'` | `keydown` filtered to `Escape` (only when visible) | `detail.event` is the `KeyboardEvent`. Disabled when `closeOnEscape: false`. |
| `'reset'` | `controller.reset()` | Programmatic close without "user" semantics. |
| `'initialization'` | Microtask after `mount()` | Emitted once. `detail.previous === null`. Subscribe synchronously to receive it. |

## Plugin options

```ts
interface CreateSidebarOptions {
  id?: string;                          // default: auto-generated
  closeOnEscape?: boolean;              // default: true
  closeOnOverlayClick?: boolean;        // default: true
  breakpoint?: SidebarBreakpointOption; // default: undefined
  initialVisible?: boolean;             // default: false
}

interface SidebarBreakpointOption {
  query: string;                        // e.g. "(min-width: 1024px)"
  onMismatch: "hide" | "keep";          // see below
}
```

`onMismatch`:

- `'hide'` — auto-hide the sidebar when the query stops matching (the v1 default behaviour).
- `'keep'` — keep `visible` unchanged; only update `matchesBreakpoint`. Use the `change` event to react.

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

### Responsive auto-hide

```js
Alpine.plugin(
  sidebarPlugin({
    breakpoint: {
      query: "(min-width: 1024px)",
      onMismatch: "hide",
    },
  }),
);
```

When the viewport crosses the breakpoint, the sidebar auto-hides and emits `change` with `source: 'breakpoint'`.

### Reacting to breakpoint mismatches with `'keep'`

When you want to render the sidebar across breakpoints but want to react to the flip:

```js
Alpine.plugin(
  sidebarPlugin({
    breakpoint: {
      query: "(min-width: 1024px)",
      onMismatch: "keep",
    },
  }),
);

createSidebar().on("change", (detail) => {
  if (detail.source !== "breakpoint") return;
  document.documentElement.dataset.layout = detail.matchesBreakpoint
    ? "desktop"
    : "mobile";
});
```

### With scroll lock integration

```js
import Alpine from "alpinejs";
import scroll from "@ailuracode/alpine-scroll";
import { sidebarPlugin, createSidebar } from "@ailuracode/alpine-sidebar";

Alpine.plugin(scroll());
Alpine.plugin(sidebarPlugin());

createSidebar().on("change", (detail) => {
  // Only react to direct user actions — let programmatic close
  // (Escape, breakpoint auto-hide) flow through naturally.
  if (detail.source !== "user") return;

  const scroll = Alpine.store("scroll");
  if (detail.visible) {
    document.documentElement.setAttribute("data-sidebar", "");
    document.documentElement.style.scrollbarGutter = "stable";
    scroll.lock();
  } else {
    document.documentElement.removeAttribute("data-sidebar");
    document.documentElement.style.scrollbarGutter = "";
    scroll.unlock();
  }
});
```

### Visual width is owned by the consumer

The plugin does not track width or mode. Define your own visual state in Alpine — for example, a 16rem panel vs. a 4rem rail:

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

You can swap this for any other strategy — a `data-mode` attribute, a separate `x-data` for the rail, a CSS-only implementation, or nothing at all.

## Migration from v1.0 to v2.0

v2.0 is a major rewrite. The breaking changes:

1. `onShow` and `onHide` plugin options removed — use `controller.on('change', ...)` instead.
2. `breakpoint` is now `{ query, onMismatch }` (an object) instead of a raw string.
3. `onOverlayClick` plugin option removed.
4. The default export is gone — import the named `sidebarPlugin` factory.

The `$store.sidebar` surface (`.visible`, `.isVisible`, `.hasOverlay`, `.matchesBreakpoint`, `.show()`, `.hide()`, `.toggle()`) is **unchanged**. Templates that read `$store.sidebar.*` keep working without edits.

### Before / after

```js
// v1.0 — default export, string breakpoint, onShow/onHide callbacks
import sidebar from "@ailuracode/alpine-sidebar";

Alpine.plugin(
  sidebar({
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
    },
    breakpoint: "(min-width: 1024px)",
  }),
);
```

```js
// v2.0 — named exports, object breakpoint, typed change event
import { sidebarPlugin, createSidebar } from "@ailuracode/alpine-sidebar";

Alpine.plugin(
  sidebarPlugin({
    breakpoint: { query: "(min-width: 1024px)", onMismatch: "hide" },
  }),
);

createSidebar().on("change", (detail) => {
  document.documentElement.toggleAttribute("data-sidebar", detail.visible);
});
```

### Body scroll lock migration

```js
// v1.0
sidebarPlugin({
  onShow: lockScroll,
  onHide: unlockScroll,
});

// v2.0
sidebarPlugin({
  breakpoint: { query: "(min-width: 1024px)", onMismatch: "hide" },
});

// + subscribe in your Alpine init or component:
import { createSidebar } from "@ailuracode/alpine-sidebar";

createSidebar().on("change", ({ current, previous }) => {
  if (current.visible && previous?.visible === false) lockScroll();
  if (!current.visible && previous?.visible === true) unlockScroll();
});
```

## See also

- [Scroll](./scroll.md) — compose with `$store.scroll` for body scroll locking via the `change` event
- [Theme](./theme.md) — same factory plugin pattern with a headless controller
- [Toggle](./toggle.md) — the `ToggleController` the sidebar composes internally
