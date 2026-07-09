# `@ailuracode/alpine-overlay`

Centralized portal root, z-index slot allocation, and open-stack registry
for Alpine.js applications.

Headless. No Tailwind, no CSS framework. No DOM mutation outside the
portal root itself.

## Install

```bash
pnpm add @ailuracode/alpine-overlay
```

## Usage

```ts
import Alpine from "alpinejs";
import overlayPlugin from "@ailuracode/alpine-overlay";

Alpine.plugin(overlayPlugin({ baseZIndex: 1000, step: 10 }));

Alpine.start();
```

Template:

```html
<template x-teleport="#overlay-root">
  <div class="dialog" :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'confirm') }">
    <!-- ... -->
  </div>
</template>
```

## API

### `$store.overlay`

| Member | Type | Description |
|---|---|---|
| `stack` | `readonly OverlayStackEntry[]` | Open overlays sorted by z-index (top last) |
| `count` | `number` | `stack.length` |
| `root` | `HTMLElement \| null` | Portal container (lazily created) |
| `baseZIndex` | `number` | Initial slot (default `1000`) |
| `step` | `number` | Slot gap (default `10`) |
| `configure(opts)` | `void` | Idempotent setup. `root`, `baseZIndex`, `step`. |
| `register(plugin, id)` | `number` | Allocate slot, returns zIndex |
| `unregister(plugin, id)` | `void` | Release slot (silent if unknown) |
| `zIndexOf(plugin, id)` | `number \| null` | Lookup allocated zIndex |
| `isOpen(plugin, id)` | `boolean` | Whether `(plugin, id)` is on the stack |
| `on('change', cb)` | `Unsubscribe` | Subscribe to stack transitions |

### `$overlay` magic

Shorthand for `$store.overlay`. Same shape.

## License

MIT © [ailuracode](https://github.com/ailuracode)