---
title: "Dialog"
description: "Package: @ailuracode/alpine-dialog"
---

Package: `@ailuracode/alpine-dialog`

Headless accessible dialog store for Alpine.js. Manages open state, focus trap, scroll locking, Escape/outside-click dismissal, and ARIA attributes. **No HTML or CSS is shipped.**

## Install

```bash
npm install @ailuracode/alpine-dialog alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import dialog, { dialogOptions } from "@ailuracode/alpine-dialog";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(scrollPlugin());
Alpine.plugin(
  dialogOptions({
    scroll: Alpine.store("scroll"),
  })
);
Alpine.start();
```

Compose scroll locking with `@ailuracode/alpine-scroll`:

```js
dialog({
  scroll: Alpine.store("scroll"),
});
```

## Store API

| Method | Description |
|--------|-------------|
| `open(id, options?)` | Open a dialog by id |
| `close(id)` | Close a dialog |
| `toggle(id, options?)` | Toggle open state |
| `isOpen(id)` | Whether the dialog is open |
| `register(id, options?)` | Pre-configure a dialog instance |
| `bindContainer(id, element)` | Attach the dialog container for focus trap |
| `handleKeydown(id, event)` | Wire Escape handling |
| `handleOutsideClick(id, event)` | Wire overlay/outside dismiss |
| `dialogProps(id)` | `role`, `aria-modal`, `aria-labelledby`, `aria-describedby` |

### Options per dialog

| Option | Default | Description |
|--------|---------|-------------|
| `closeOnEscape` | `true` | Close on Escape |
| `closeOnOutsideClick` | `true` | Close on outside click |
| `scrollLock` | `true` | Lock shared scroll store while open when `scroll` is configured |
| `onOpen` / `onClose` | — | Lifecycle callbacks |

## Basic markup

```html
<div
  x-data
  x-init="$store.dialog.register('settings')"
  @keydown.window="$store.dialog.handleKeydown('settings', $event)"
>
  <button @click="$store.dialog.open('settings', { trigger: $event.target })">
    Settings
  </button>

  <template x-teleport="body">
    <div
      x-show="$store.dialog.isOpen('settings')"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        x-bind="$store.dialog.dialogProps('settings')"
        x-init="$store.dialog.bindContainer('settings', $el)"
        @click.stop
      >
    <h2 id="settings-title">Settings</h2>
    <p id="settings-desc">Update your preferences.</p>
    <button @click="$store.dialog.close('settings')">Close</button>
    </div>
  </div>
  </template>
</div>
```

## Accessibility

- `role="dialog"` and `aria-modal="true"` via `dialogProps()`
- Focus trap activates when the container is bound and the dialog opens
- Focus restores to the trigger element on close
- Escape dismisses when enabled

## SSR

State is in-memory. Guard DOM bindings (`bindContainer`, focus trap) behind `x-init` or client-only wrappers.

## Integration

- **Scroll** — pass `$store.scroll` as `scroll`
- **Toast** — show confirmation toasts after dialog actions in your UI layer (not a required dependency)

## Limitations

- Stacking/z-index is consumer-owned — wrap modals in `<template x-teleport="body">` when inside `overflow-hidden` ancestors (`x-teleport` requires a `<template>` tag in Alpine 3)
- One focus trap per dialog id; bind the dialog panel root element
