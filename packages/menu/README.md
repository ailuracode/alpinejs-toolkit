# @ailuracode/alpine-menu

Headless accessible menu store for Alpine.js — dropdowns, context menus, keyboard navigation, and roving tabindex. **Only one menu open at a time by default.** No markup or CSS included.

**[Full documentation →](../../docs/plugins/menu.md)**

## Install

```bash
pnpm add @ailuracode/alpine-menu alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import { menuPlugin } from "@ailuracode/alpine-menu";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(scrollPlugin());
Alpine.plugin(menuPlugin({ scroll: Alpine.store("scroll") }));
```

## Exclusive mode

Opening a menu closes all others by default (`exclusive: true`). Pass `exclusive: false` to allow multiple open menus, or use per-menu `group` for menubar-style exclusivity:

```ts
Alpine.plugin(menuPlugin({ exclusive: false }));
$store.menu.register("file", { group: "menubar-1" });
$store.menu.register("edit", { group: "menubar-1" });
```

## Store API

```ts
$store.menu.register("user-menu", { onSelect: (id) => {} });
$store.menu.open("user-menu");
$store.menu.close("user-menu");
$store.menu.toggle("user-menu");
$store.menu.isOpen("user-menu");
$store.menu.activeItem("user-menu");
```

## Standalone usage (no Alpine)

```ts
import {
  createMenuController,
  createMenuStore,
  createMenuStoreFromController,
} from "@ailuracode/alpine-menu";

const controller = createMenuController({ exclusive: true });
controller.register("user-menu");
controller.open("user-menu");
controller.isOpen("user-menu"); // true

const store = createMenuStore({ exclusive: true });
// or: createMenuStoreFromController(controller) for a custom adapter
```

| Controller API | Description |
|----------------|-------------|
| `hasInstance(id)` | Whether a menu id is registered |
| `snapshotInstances()` | Shallow readonly copies for adapter sync |
| `isOpen(id)` / `activeItem(id)` | Query methods — prefer over reading internal state |

Subscribe to `controller.on("change", …)` (or `open` / `close` / `select`) to mirror state into your own UI layer.

## Architecture

`MenuController` owns all mutable state in a private instance registry. The Alpine plugin copies **readonly snapshots** into `$store.menu.instances` on each `change` event so templates stay reactive. Mutating `$store.menu.instances[id]` directly does not change controller state.

## Migration

| Removed / changed | Replacement |
|-------------------|-------------|
| `MenuController.instances` | `snapshotInstances()` or `hasInstance(id)` |
| `constructor(instances, config)` | `constructor(config)` |
| Commands with an `instances` first argument | Same command without `instances` — e.g. `open(id)` |
| `controller.toStore()` | `createMenuStore()` or `createMenuStoreFromController(controller)` |
