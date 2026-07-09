---
title: "Tooltip"
description: "Package: @ailuracode/alpine-tooltip"
---

Package: `@ailuracode/alpine-tooltip`

Headless tooltip store. Hover/focus triggers, open/close delays, Escape dismiss. Pair with `@alpinejs/anchor` for placement.

## Install

```bash
npm install @ailuracode/alpine-tooltip alpinejs
```

Positioning (Floating UI via Alpine):

```bash
npm install @alpinejs/anchor
```

## Store API

| Method | Description |
|--------|-------------|
| `open(id)` / `close(id)` / `toggle(id)` | Visibility |
| `isOpen(id)` | Open state |
| `register(id, options?)` | Configure delays and lifecycle callbacks |
| `showOnHover(id)` / `hideOnHover(id)` | Hover helpers |
| `showOnFocus(id)` / `hideOnFocus(id)` | Focus helpers |
| `handleKeydown(id, event)` | Escape dismiss |

### Options per tooltip

| Option | Default | Description |
|--------|---------|-------------|
| `openDelay` | `0` | ms before opening on hover/focus |
| `closeDelay` | `0` | ms before closing on mouseleave/blur |
| `onOpen` / `onClose` | — | Lifecycle callbacks |

## Basic markup

```html
<div
  x-data
  x-init="$store.tooltip.register('help', { openDelay: 150 })"
  @keydown.window="$store.tooltip.isOpen('help') && $store.tooltip.handleKeydown('help', $event)"
>
  <button
    x-ref="helpAnchor"
    @mouseenter="$store.tooltip.showOnHover('help')"
    @mouseleave="$store.tooltip.hideOnHover('help')"
    @focus="$store.tooltip.showOnFocus('help')"
    @blur="$store.tooltip.hideOnFocus('help')"
    aria-describedby="help-tooltip"
  >
    Help
  </button>

  <template x-teleport="#overlay-root">
    <div
      id="help-tooltip"
      x-show="$store.tooltip.isOpen('help')"
      :style="{ zIndex: $store.overlay.zIndexOf('tooltip', 'help') }"
      x-anchor.top.fixed.offset.8="$refs.helpAnchor"
      role="tooltip"
      class="rounded-md border bg-background px-2 py-1 text-sm shadow"
    >
      Tooltip content
    </div>
  </template>
</div>
```

## Stacking & z-index (overlay)

Tooltips frequently race each other on hover, and they routinely
collide with dropdowns and modals. When you load
`@ailuracode/alpine-overlay`, the teleported arrow reads its
`z-index` from the same scale dialog and menu use:

```html
<template x-teleport="#overlay-root">
  <div
    role="tooltip"
    :style="{ zIndex: $store.overlay.zIndexOf('tooltip', 'help') }"
    x-anchor.top.fixed.offset.8="$refs.helpAnchor"
  >
    <!-- tooltip body -->
  </div>
</template>
```

The first tooltip to open gets the base slot (default `1000`), the
next gets `1010`, etc. — so two tooltips open at once no longer stack
in DOM order (which can flip arbitrarily when anchors change).

Register `Alpine.plugin(overlayPlugin())` **before** tooltip in your
entrypoint. Drop the old `z-50` / `z-[N]` class. Soft-peer fallback:
keep `x-teleport="body"` + your utility class if overlay is not
loaded. See [Overlay → When NOT to use](./overlay.md#when-not-to-use-overlay).

## SSR

Delays require client-side timers — initialize on the client via `x-init`.

## Limitations

- Placement is your responsibility — use `@alpinejs/anchor` (`x-anchor.*.fixed`) for flip, shift, and scroll tracking
- Use `<template x-teleport="body">` + `x-anchor.fixed` when the floating node sits inside `overflow-hidden` ancestors
- Wire `@keydown.window` while open so Escape works when focus stays on the trigger
