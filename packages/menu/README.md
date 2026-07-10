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
