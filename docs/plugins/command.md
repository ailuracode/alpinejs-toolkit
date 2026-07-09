---
title: "Command"
description: "Package: @ailuracode/alpine-command"
---

Package: `@ailuracode/alpine-command`

Headless command palette (Spotlight-style) store — searchable actions, groups, keyboard navigation, shortcuts, and disabled items.

## Install

```bash
npm install @ailuracode/alpine-command alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import command from "@ailuracode/alpine-command";

Alpine.plugin(
  command({
    onRun(item) {
      console.log("Ran", item.id);
    },
  })
);
Alpine.start();
```

## Store API

| Member | Description |
|--------|-------------|
| `open()` / `close()` / `toggle()` | Palette visibility |
| `isOpen` | Whether the palette is open |
| `search` | Reactive filter string |
| `activeIndex` | Keyboard-highlighted row |
| `filteredItems` | Items matching `search` |
| `groupedItems` | Filtered items grouped by `group` |
| `register(item)` | Register an action |
| `run(id)` | Execute an action |
| `handleKeydown(event)` | Typing, Backspace, Arrow/Home/End/Enter/Escape |

### Command item

```ts
{
  id: "toggle-theme",
  label: "Toggle theme",
  group?: "Appearance",
  shortcut?: "⌘K",
  keywords?: ["dark", "light"],
  disabled?: false,
  action: () => {},
}
```

## Integration

- **Dialog** — render the palette inside a dialog panel and open via `$store.dialog` + `$store.command.open()` in demos
- **Toast** — call `$toast()` inside `action` or `onRun` for feedback (optional peer)

Neither dialog nor toast is a required dependency.

## Stacking & z-index (overlay)

Command palettes are singletons — there is only ever one. The plugin
ships the palette without an explicit z-index and lets you wire the
overlay store when `@ailuracode/alpine-overlay` is loaded:

```html
<template x-teleport="#overlay-root">
  <div
    x-show="$store.command.isOpen"
    :style="{ zIndex: $store.overlay.zIndexOf('command') ?? 1000 }"
    class="fixed inset-0 flex items-start justify-center p-6 pt-[12vh]"
  >
    <div class="absolute inset-0 bg-black/50" aria-hidden="true"></div>
    <div
      class="relative z-10 w-full max-w-lg rounded-lg border bg-background shadow-2xl"
      role="dialog"
      aria-label="Command palette"
    >
      <!-- input + filtered list -->
    </div>
  </div>
</template>
```

The `?? 1000` fallback keeps the palette above page content even when
overlay is not loaded (no crash — `$store.overlay` simply returns
`undefined` and the inline `1000` is used).

Register `Alpine.plugin(overlayPlugin())` **before** command in your
entrypoint so `#overlay-root` exists before the palette first
evaluates. Soft-peer fallback: keep the legacy `x-teleport="body"`
template with a Tailwind z-class. See
[Overlay → When NOT to use](./overlay.md#when-not-to-use-overlay).

## SSR

Register commands on the client. Global shortcut listeners are consumer-owned.

## Limitations

- Built-in filter is substring match on label/group/shortcut/keywords
- No built-in modal markup — pair with `@ailuracode/alpine-dialog` when needed
