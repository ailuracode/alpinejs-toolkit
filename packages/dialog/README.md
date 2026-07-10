# @ailuracode/alpine-dialog

Headless accessible dialog store for Alpine.js — open/close state, focus trap, scroll lock hooks, and ARIA helpers. No markup or CSS included.

**[Full documentation →](../../docs/plugins/dialog.md)**

## Install

```bash
pnpm add @ailuracode/alpine-dialog alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import { dialogPlugin } from "@ailuracode/alpine-dialog";

Alpine.plugin(
  dialogPlugin({
    onLockChange(locked) {
      // compose with $store.scroll.lock() / unlock()
    },
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
  onLockChange?: (locked: boolean) => void,  // hook for scroll lock integration
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
