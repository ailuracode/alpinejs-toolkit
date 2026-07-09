---
title: "Dialog"
description: "Package: @ailuracode/alpine-dialog"
---

Package: `@ailuracode/alpine-dialog`

Headless accessible dialog store for Alpine.js. Manages open state, focus trap, scroll-lock callbacks, Escape/outside-click dismissal, and ARIA attributes. **No HTML or CSS is shipped.**

## Install

```bash
npm install @ailuracode/alpine-dialog alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import dialog, { dialogOptions } from "@ailuracode/alpine-dialog";

Alpine.plugin(
  dialogOptions({
    onLockChange(locked) {
      document.documentElement.toggleAttribute("data-dialog-open", locked);
    },
  })
);
Alpine.start();
```

Compose scroll locking with `@ailuracode/alpine-scroll`:

```js
dialog({
  onLockChange(locked) {
    locked ? Alpine.store("scroll").lock() : Alpine.store("scroll").unlock();
  },
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
| `scrollLock` | `true` | Notify `onLockChange` while open |
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

  <template x-teleport="#overlay-root">
    <div
      x-show="$store.dialog.isOpen('settings')"
      :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'settings') }"
      class="fixed inset-0 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/50" aria-hidden="true"></div>
      <div
        class="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
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

## Stacking & z-index (overlay)

When you load `@ailuracode/alpine-overlay` alongside dialog, the teleported
container reads its `z-index` from `$store.overlay` instead of a hardcoded
utility class:

```html
<template x-teleport="#overlay-root">
  <div
    :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'settings') }"
    class="fixed inset-0 flex items-center justify-center p-4"
  >
    <div class="absolute inset-0 bg-black/50" aria-hidden="true"></div>
    <div class="relative z-10 …"> … </div>
  </div>
</template>
```

Why this matters: dialog, menu, tooltip, and command all share the same
portal. When two overlays are open concurrently the overlay store hands
out staggered z-indices from a single scale — modal A stays under modal
B without per-template hacks. Register `Alpine.plugin(overlayPlugin())`
**before** dialog (the portal root is created eagerly on registration, so
any `x-teleport="#overlay-root"` that evaluates earlier will no-op).

Removal note: drop your old `z-[N]` / `z-50` / `z-60` / `z-[60]` class
from the dialog wrapper. Programmatic `style.zIndex` has higher
specificity than any utility class, so the leftover class would
silently lose — leaving it works visually, but wastes a style rule.

Soft-peer fallback: if you do **not** load overlay, keep the legacy
`x-teleport="body"` template with a Tailwind z-class. Alpine logs a
warning when a template references `$store.overlay` that does not
exist, but pages render correctly. See
[Overlay → When NOT to use](./overlay.md#when-not-to-use-overlay) for
the full migration matrix.

## Accessibility

- `role="dialog"` and `aria-modal="true"` via `dialogProps()`
- Focus trap activates when the container is bound and the dialog opens
- Focus restores to the trigger element on close
- Escape dismisses when enabled

## SSR

State is in-memory. Guard DOM bindings (`bindContainer`, focus trap) behind `x-init` or client-only wrappers.

## Integration

- **Scroll** — use `onLockChange` with `$store.scroll`
- **Toast** — show confirmation toasts after dialog actions in your UI layer (not a required dependency)

## Limitations

- Stacking/z-index is consumer-owned — wrap modals in `<template x-teleport="body">` when inside `overflow-hidden` ancestors (`x-teleport` requires a `<template>` tag in Alpine 3)
- One focus trap per dialog id; bind the dialog panel root element
