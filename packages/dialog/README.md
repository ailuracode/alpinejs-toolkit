# @ailuracode/alpine-dialog

Headless accessible dialog store for Alpine.js — open/close state, focus trap, scroll lock integration, and ARIA helpers. No markup or CSS included.

## Install

```bash
pnpm add @ailuracode/alpine-dialog alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import { dialogPlugin } from "@ailuracode/alpine-dialog";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(scrollPlugin());
Alpine.plugin(
  dialogPlugin({
    scroll: Alpine.store("scroll"),
  })
);
Alpine.start();
```

## Store API

```ts
// Open / close / toggle
$store.dialog.open("settings");
$store.dialog.close("settings");
$store.dialog.toggle("settings");
$store.dialog.isOpen("settings");

// Register / unregister instances
$store.dialog.register("confirm", { closeOnEscape: true, scrollLock: true });
$store.dialog.unregister("confirm");

// Accessibility helpers
$store.dialog.bindContainer("settings", containerEl);
$store.dialog.handleKeydown("settings", event);
$store.dialog.handleOutsideClick("settings", event);
$store.dialog.dialogProps("settings");
// → { role: "dialog", "aria-modal": true, "aria-labelledby": ..., "aria-describedby": ... }

// Cleanup
$store.dialog.destroy();
```

## Options

```ts
dialogPlugin({
  id?: string,                    // controller identifier
  closeOnEscape?: boolean,        // default: true
  closeOnOutsideClick?: boolean,  // default: true
  scrollLock?: boolean,           // default: true
  scroll?: ScrollStore,           // optional @ailuracode/alpine-scroll store
});
```

## Standalone usage (no Alpine)

```ts
import { createDialogController } from "@ailuracode/alpine-dialog";

const controller = createDialogController({ scrollLock: true });
controller.register("my-dialog");
controller.open("my-dialog");
controller.isOpen("my-dialog"); // true
controller.close("my-dialog");
controller.destroy();
```

Use `createDialogStore()` for a store-shaped object without Alpine, or `createDialogStoreFromController(controller)` when wiring a custom adapter.

| Controller API | Description |
|----------------|-------------|
| `hasInstance(id)` | Whether a dialog id is registered |
| `snapshotInstances()` | Shallow readonly copies for adapter sync |
| `isOpen(id)` | Query open state |

The controller emits `open`, `close`, and `change` events. The Alpine plugin mirrors snapshots into `$store.dialog.instances`.

## Architecture

`DialogController` owns all mutable state. `$store.dialog.instances` is a reactive mirror updated on `open`, `close`, and `change`. Mutating store snapshots directly does not change controller state.

## Migration

| Removed / changed | Replacement |
|-------------------|-------------|
| `controller.instances` getter | `snapshotInstances()` or `hasInstance(id)` |
| `controller.toStore()` | `createDialogStore()` or `createDialogStoreFromController(controller)` |

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
