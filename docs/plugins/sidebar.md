---
title: "Sidebar"
description: "Package: @ailuracode/alpine-sidebar"
---

Package: `@ailuracode/alpine-sidebar`

Controls sidebar **visibility** (show / hide / toggle) with overlay, keyboard navigation, and responsive breakpoints. CSS-framework agnostic — all visual changes are applied by your listeners. Compose with `@ailuracode/alpine-scroll` for body scroll locking.

The plugin is intentionally **headless** and does not know about the width, mode, or appearance of your sidebar. The visual representation (drawer, rail, mini, expanded, floating, etc.) is owned by the consumer via local Alpine state.

> **v2.0 is a breaking rewrite.** The plugin is now a thin adapter on top of a headless `SidebarController`. `onShow` / `onHide` plugin options are gone — subscribe to `controller.on('change', detail => …)` instead. `breakpoint` is now `{ query, onMismatch }` instead of a raw string. See the [Migration → v2.0](#migration-from-v10-to-v20) section below.
>
> **v2.1.0 adds opt-in persistence.** `initialVisible` was renamed to `initial` (a TypeScript compile error for v2.0 callers passing the old name). New `storage` and `persistKey` options wire the sidebar's `visible` boolean to a persistence adapter. See the [Persistence](#persistence) section and the [Migration → v2.1.0](#migration-from-v20-to-v210) section.

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
  initial: false,
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
  initial?: boolean;                    // default: false (renamed from initialVisible in v2.1.0)
  storage?: SidebarStorage;             // v2.1.0 opt-in persistence
  persistKey?: string;                  // v2.1.0 shortcut for createLocalStorageSidebarStorage({ key })
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

## Persistence

v2.1.0 layers opt-in persistence onto the v2.0 headless controller. Three out-of-the-box adapters ship with the package; custom adapters are a `SidebarStorage` interface implementation away.

### `localStorage` adapter

The most common case — persist `visible` to `window.localStorage` and sync across tabs via the `storage` event:

```js
import {
  sidebarPlugin,
  createLocalStorageSidebarStorage,
  DEFAULT_SIDEBAR_STORAGE_KEY,
} from "@ailuracode/alpine-sidebar";

Alpine.plugin(
  sidebarPlugin({
    storage: createLocalStorageSidebarStorage({ key: DEFAULT_SIDEBAR_STORAGE_KEY }),
  }),
);
```

Defaults: `key` is `DEFAULT_SIDEBAR_STORAGE_KEY` (`"sidebar-visible"`); `crossTab` is `true` — pass `crossTab: false` to skip the cross-tab listener registration.

The `persistKey` shortcut builds the same adapter internally:

```js
Alpine.plugin(sidebarPlugin({ persistKey: "app-sidebar" }));
// equivalent to: { storage: createLocalStorageSidebarStorage({ key: "app-sidebar" }) }
```

When both `storage` and `persistKey` are present, the explicit `storage` wins (silent preference).

### In-memory adapter

Hermetic storage for tests and SSR. Each instance is independent; `subscribe` fires in-process only — no `window` access.

```js
import { createMemorySidebarStorage } from "@ailuracode/alpine-sidebar";

Alpine.plugin(
  sidebarPlugin({
    storage: createMemorySidebarStorage(false), // initial value
  }),
);
```

### Alpine `$persist` helper

For consumers already using `@alpinejs/persist`, the package ships a convenience helper that wires `Alpine.$persist` to the sidebar's `visible` field:

```js
import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import { sidebarPlugin, persistSidebarVisible } from "@ailuracode/alpine-sidebar";

Alpine.plugin(persist); // @alpinejs/persist must be loaded
Alpine.plugin(sidebarPlugin());
Alpine.start();

persistSidebarVisible(Alpine); // wraps $store.sidebar.visible
```

The helper warns and returns `false` when `@alpinejs/persist` is not detected or `Alpine.store('sidebar')` is not registered. Pass `{ strict: true }` to throw a `ToolkitError` instead.

> `$persist` and `createSidebar({ storage: ... })` are mutually exclusive in practice — they both write to `store.visible`. Pick one or the other.

### httpOnly cookie SSR + server sync bridge

For SSR applications with an httpOnly cookie holding the sidebar state, wire a custom `SidebarStorage` adapter that talks to the server. The package does NOT implement httpOnly cookie support itself — the adapter is the consumer's responsibility.

```js
import { sidebarPlugin, type SidebarStorage } from "@ailuracode/alpine-sidebar";

// Fetch the persisted value from the server. The cookie is httpOnly
// so the client never sees it; the API endpoint reads it and returns
// the boolean.
const apiStorage: SidebarStorage = {
  async get() {
    const res = await fetch("/api/sidebar", { credentials: "include" });
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body.visible === "boolean" ? body.visible : null;
  },
  async set(value) {
    await fetch("/api/sidebar", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visible: value }),
    });
  },
  async remove() {
    await fetch("/api/sidebar", { method: "DELETE", credentials: "include" });
  },
};

Alpine.plugin(sidebarPlugin({ storage: apiStorage }));
```

The controller's `set` path is fire-and-forget — the `change` event fires synchronously after the toggle. Promise rejections are silently swallowed (logged via `console.warn`).

### Cross-tab sync semantics

When the storage adapter exposes a `subscribe` hook (the default `localStorage` adapter does), the controller:

1. Hydrates `visible` from `storage.get()` on `mount()` via `setSilently` (the `change` event with `source: 'initialization'` carries the hydrated value).
2. Writes `storage.set(visible)` after every `source: 'user'` transition. Breakpoint, escape, reset, and cross-tab events do NOT write.
3. Listens to cross-tab events. `newValue: "true"`/`"false"` apply with `source: 'storage'`; `newValue: null` (key cleared) falls back to the configured `initial`.
4. Detects echo: writes are tagged with `#lastWritten` so a self-arriving cross-tab event is dropped. Last-writer-wins per tab; documented limitation.

### `change` event sources

| `source` | Trigger | Notes |
|----------|---------|-------|
| `'user'` | `show()` / `hide()` / `toggle()` | Persists. |
| `'breakpoint'` | `matchMedia` `change` event | Does NOT persist. |
| `'escape'` | `keydown` filtered to `Escape` (only when visible) | Does NOT persist. |
| `'reset'` | `controller.reset()` | Does NOT persist. |
| `'initialization'` | Microtask after `mount()` | Does NOT persist. |
| `'storage'` | Cross-tab `storage` event (v2.1.0) | Does NOT persist. |

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

createSidebar().on("change", ({ visible, previous }) => {
  if (visible && previous?.visible === false) lockScroll();
  if (!visible && previous?.visible === true) unlockScroll();
});
```

## Migration from v2.0 to v2.1.0

v2.1.0 is a **minor** release with one TypeScript-level breaking change and additive persistence options.

### `initialVisible` → `initial` rename

The v2.0 `initialVisible?: boolean` option is renamed to `initial?: boolean`. The old name is removed:

```diff
-createSidebar({ initialVisible: true });
+createSidebar({ initial: true });
```

TypeScript will report a compile error if you don't update. The semantics are unchanged.

### New opt-in persistence options

`storage` and `persistKey` are additive. Consumers who do not pass them see no behavioral change.

```js
// v2.1.0 — wire a localStorage adapter
import { sidebarPlugin, createLocalStorageSidebarStorage } from "@ailuracode/alpine-sidebar";

Alpine.plugin(
  sidebarPlugin({
    storage: createLocalStorageSidebarStorage({ key: "app-sidebar" }),
  }),
);

// or use the shortcut
Alpine.plugin(sidebarPlugin({ persistKey: "app-sidebar" }));
```

### New `SidebarChangeSource` value: `'storage'`

The `detail.source` discriminator gains a 6th value when a `storage` adapter with cross-tab sync is wired. Existing consumers branching on `source` continue to work — `'storage'` is additive.

### Behavior note for v2.0 callers adopting `storage`

Consumers passing `storage` for the first time will observe their first `change` event after `mount()` reflect the persisted value rather than `false`. Pass no `storage` (default behavior) to preserve v2.0 semantics.

## See also

- [Scroll](./scroll.md) — compose with `$store.scroll` for body scroll locking via the `change` event
- [Theme](./theme.md) — same factory plugin pattern with a headless controller
- [Toggle](./toggle.md) — the `ToggleController` the sidebar composes internally
