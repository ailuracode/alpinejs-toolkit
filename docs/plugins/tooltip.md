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

  <template x-teleport="body">
    <div
      id="help-tooltip"
      x-show="$store.tooltip.isOpen('help')"
      x-anchor.top.fixed.offset.8="$refs.helpAnchor"
      role="tooltip"
      class="z-50"
    >
      Tooltip content
    </div>
  </template>
</div>
```

## SSR

Delays require client-side timers — initialize on the client via `x-init`.

## Limitations

- Placement is your responsibility — use `@alpinejs/anchor` (`x-anchor.*.fixed`) for flip, shift, and scroll tracking
- Use `<template x-teleport="body">` + `x-anchor.fixed` when the floating node sits inside `overflow-hidden` ancestors
- Wire `@keydown.window` while open so Escape works when focus stays on the trigger
