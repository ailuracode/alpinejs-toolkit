# @ailuracode/alpine-sidebar

Alpine.js sidebar store focused on **visibility** — open/close state, overlay, keyboard navigation, and responsive breakpoints. Compose with `@ailuracode/alpine-scroll` for body scroll locking.

The plugin is **headless** and knows nothing about the width, mode, or appearance of your sidebar. The consumer owns the visual representation (drawer, rail, mini, expanded, floating, etc.) via local Alpine state.

> **v2.0 is a breaking rewrite.** The plugin is now a thin adapter on top of a headless `SidebarController`. `onShow` / `onHide` plugin options are gone — subscribe to `controller.on('change', detail => …)` instead. `breakpoint` is now `{ query, onMismatch }` instead of a raw string. See the [Migration → v2.0](#migration-from-v10-to-v20) section below.

**[Full documentation →](../../docs/plugins/sidebar.md)**

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

All visual changes (classes, attributes, transitions) are applied by your listeners — no CSS framework is assumed.

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
| `hasOverlay` | `true` when visible and `closeOnOverlayClick` is enabled |

### Methods

| Method | Description |
|--------|-------------|
| `show()` | Show the sidebar (emits `change` with `source: 'user'`) |
| `hide()` | Hide the sidebar (emits `change` with `source: 'user'`) |
| `toggle()` | Toggle visible/hidden (emits `change` with `source: 'user'`) |

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
  // detail.previous === null only on the very first emit (source === 'initialization')
  // detail.event is present only when source === 'escape' | 'breakpoint'
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

### Basic sidebar

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
  x-show="$store.sidebar.visible"
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

### Manage visual width locally

The plugin only controls visibility. Define your own width / mode in Alpine:

```html
<div
  x-data="{ expanded: true }"
  :class="expanded ? 'w-64' : 'w-16'"
>
  <button @click="expanded = !expanded">Toggle width</button>

  <aside x-show="$store.sidebar.visible">
    <!-- … -->
  </aside>
</div>
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

### With breakpoint auto-hide

```js
Alpine.plugin(
  sidebarPlugin({
    breakpoint: {
      query: "(min-width: 1024px)",
      onMismatch: "hide", // auto-hide on mobile (v1 behaviour)
    },
  }),
);
```

When the viewport no longer matches the breakpoint, the sidebar auto-hides and emits `change` with `source: 'breakpoint'`.

### Reacting to breakpoint mismatches with `'keep'`

When you want to render the sidebar across breakpoints but want to react to the flip:

```js
Alpine.plugin(
  sidebarPlugin({
    breakpoint: {
      query: "(min-width: 1024px)",
      onMismatch: "keep", // visible stays true; matchesBreakpoint flips
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

## License

MIT © [ailuracode](https://github.com/ailuracode)