# @ailuracode/alpine-tooltip

Headless tooltip store for Alpine.js — open/close state, hover/focus delays, Escape dismiss. Pair with `@alpinejs/anchor` for placement.

**[Full documentation →](../../docs/plugins/tooltip.md)**

## Install

```bash
pnpm add @ailuracode/alpine-tooltip alpinejs
pnpm add @alpinejs/anchor
```

## Store API

```ts
$store.tooltip.open("help");
$store.tooltip.close("help");
$store.tooltip.isOpen("help");
$store.tooltip.register("help", { openDelay: 150 });
```

Position with `x-anchor.*.fixed` on the floating element.

## Standalone usage (no Alpine)

```ts
import {
  createTooltipController,
  createTooltipStore,
  createTooltipStoreFromController,
} from "@ailuracode/alpine-tooltip";

const controller = createTooltipController();
controller.register("help", { openDelay: 150 });
controller.open("help");

const store = createTooltipStore();
// or: createTooltipStoreFromController(controller)
```

| Controller API | Description |
|----------------|-------------|
| `hasInstance(id)` | Whether a tooltip id is registered |
| `snapshotInstances()` | Shallow readonly copies for adapter sync |
| `isOpen(id)` | Query open state |

Subscribe to `controller.on("change", …)` to mirror state into your own UI layer.

## Architecture

`TooltipController` owns all mutable state. The Alpine plugin copies snapshots into `$store.tooltip.instances` on each `change` event. Mutating store snapshots directly does not change controller state.

## Migration

| Removed / changed | Replacement |
|-------------------|-------------|
| `controller.instances` getter | `snapshotInstances()` or `hasInstance(id)` |
| `controller.toStore()` | `createTooltipStore()` or `createTooltipStoreFromController(controller)` |
