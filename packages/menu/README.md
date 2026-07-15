# @ailuracode/alpine-menu

Headless menu store for dropdowns and context menus. Keyboard navigation (`Arrow*`, `Home`, `End`, `Enter`, `Space`, `Escape`), roving tabindex, and ARIA helpers. **Only one menu open at a time by default** — opening a menu closes any other open menu. **No HTML or CSS is shipped.**

## Install

```bash
pnpm add @ailuracode/alpine-menu alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import menu from "@ailuracode/alpine-menu";

Alpine.plugin(menu());
Alpine.start();
```

Compose scroll locking with `@ailuracode/alpine-scroll` (active while at least one menu is open):

```js
menu({
  scroll: Alpine.store("scroll"),
});
```

Position with `@alpinejs/anchor` (recommended for teleported menus):

```js
Alpine.plugin(anchor);
// x-anchor.bottom-start.fixed on the menu panel
```

## Plugin options

| Option | Default | Description |
|--------|---------|-------------|
| `exclusive` | `true` | When opening a menu, close all other open menus |
| `scroll` | — | Optional `@ailuracode/alpine-scroll` store locked while at least one menu is open |
| `storeKey` | `"menu"` | Alpine store key (see [Avoiding name collisions](#avoiding-name-collisions)) |

### Avoiding name collisions

If your application already owns a `$store.menu` — or another toolkit plugin registers on that name — rename the integration surface without touching the controller:

```ts
Alpine.plugin(menuPlugin({ storeKey: "dropdown" })); // → $store.dropdown
```

The exposed constant `DEFAULT_MENU_STORE_KEY` keeps the rename discoverable from TypeScript.

## Exclusive mode

By default (`exclusive: true`), `open(id)` and `toggle(id)` close every other open menu before opening the target. This is the expected behavior for **dropdown menus**, **context menus**, and similar overlays where only one panel should be visible.

```js
// Default — no config needed
Alpine.plugin(menu());
```

When a second menu opens, the first closes automatically. Scroll lock stays in sync: replacing one open menu with another does not briefly unlock the page.

### Multiple menus open

Pass `exclusive: false` to allow unrelated menus to stay open at the same time:

```js
Alpine.plugin(menu({ exclusive: false }));
```

### Grouped exclusivity (menubar)

With `exclusive: false`, assign a `group` when registering menus to enforce **one open menu per group** — useful for a horizontal menubar without affecting global dropdowns:

```js
Alpine.plugin(menu({ exclusive: false }));

$store.menu.register("file", { group: "menubar-1" });
$store.menu.register("edit", { group: "menubar-1" });
$store.menu.register("help", { group: "menubar-2" });
$store.menu.register("account"); // no group — never auto-closed by group logic
```

| Scenario | `file` open | `edit` open | `help` open | `account` open |
|----------|-------------|-------------|-------------|----------------|
| Open `edit` | closes | opens | unchanged | unchanged |
| Open `account` | unchanged | unchanged | unchanged | opens |
| Open `help` then `file` | opens | unchanged | unchanged | unchanged |

`group` only applies when plugin `exclusive` is `false`. With `exclusive: true` (default), every open menu is closed regardless of group.

## Store API

| Method | Description |
|--------|-------------|
| `register(id, options?)` | Create a menu instance (`orientation`, `group`, callbacks) |
| `open(id)` / `close(id)` / `toggle(id)` | Visibility; `open` / `toggle` close other menus when `exclusive` is enabled |
| `isOpen(id)` | Open state |
| `activeItem(id)` | Currently focused item id |
| `registerItem(menuId, itemId, options?)` | Register a menu item |
| `bindMenu(menuId, element)` | Attach the menu root for roving focus |
| `bindTrigger(menuId, element)` | Attach the trigger for outside-click detection |
| `handleOutsideClick(menuId, event)` | Close when clicking outside trigger + menu |
| `handleWindowOutsideClick(event, menuIds?)` | Outside-click helper for multiple menus on one page |
| `handleKeydown(menuId, event)` | Keyboard navigation |
| `handleWindowKeydown(event, menuIds?)` | Route keyboard events to the first open menu |
| `itemProps(menuId, itemId)` | `role`, `tabindex`, `aria-disabled` |
| `menuProps(menuId)` | `role`, `aria-orientation` |

### Options per menu

| Option | Default | Description |
|--------|---------|-------------|
| `orientation` | `"vertical"` | Arrow key axis |
| `closeOnSelect` | `true` | Close after `selectItem()` |
| `group` | — | When plugin `exclusive` is `false`, only one menu in the same `group` may be open at a time |
| `onOpen` / `onClose` | — | Lifecycle callbacks |
| `onSelect` | — | Fired when an item is chosen (click, Enter, or Space) |

## Architecture

`MenuController` owns all mutable menu state in a private instance registry. The Alpine plugin is a thin adapter:

1. Store commands (`open`, `close`, `registerItem`, …) forward to the controller.
2. The controller emits typed `open`, `close`, `select`, and `change` events.
3. The plugin copies **readonly snapshots** into `$store.menu.instances` so Alpine templates stay reactive.

Mutating `$store.menu.instances[id]` directly does **not** change controller state. Use store methods or subscribe to controller events for custom adapters.

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

const store = createMenuStore({ exclusive: true });
// or: createMenuStoreFromController(controller)
```

| Controller API | Description |
|----------------|-------------|
| `hasInstance(id)` | Whether a menu id is registered |
| `snapshotInstances()` | Shallow readonly copies for adapter sync |
| `isOpen(id)` / `activeItem(id)` | Query methods |

## Migration

| Removed / changed | Replacement |
|-------------------|-------------|
| `MenuController.instances` | `snapshotInstances()` or `hasInstance(id)` |
| `constructor(instances, config)` | `constructor(config)` |
| Commands with an `instances` first argument | Same command without `instances` — e.g. `open(id)` |
| `controller.toStore()` | `createMenuStore()` or `createMenuStoreFromController(controller)` |

## Basic markup

```html
<div
  x-data
  x-init="$store.menu.register('user-menu', { onSelect: (id) => console.log(id) }); ['profile','settings','logout'].forEach(id => $store.menu.registerItem('user-menu', id))"
  @keydown.window="$store.menu.handleWindowKeydown($event, ['user-menu'])"
  x-on:click.window="$store.menu.handleWindowOutsideClick($event, ['user-menu'])"
>
  <div x-ref="menuTrigger" x-init="$store.menu.bindTrigger('user-menu', $el)">
    <button @click="$store.menu.toggle('user-menu')" aria-haspopup="menu">Account</button>
  </div>

  <template x-teleport="body">
    <ul
      x-bind="$store.menu.menuProps('user-menu')"
      x-init="$store.menu.bindMenu('user-menu', $el)"
      x-show="$store.menu.isOpen('user-menu')"
      x-anchor.bottom-start.offset.8.fixed="$refs.menuTrigger"
      class="z-50 min-w-48"
    >
    <template x-for="id in ['profile','settings','logout']" :key="id">
      <li>
        <button
          x-bind="$store.menu.itemProps('user-menu', id)"
          @click="$store.menu.selectItem('user-menu', id)"
          x-text="id"
        ></button>
      </li>
    </template>
  </ul>
  </template>
</div>
```

## Accessibility

- Roving `tabindex` on the active item
- Vertical or horizontal orientation
- `Escape` closes the menu
- `Enter` / `Space` selects the active item

## SSR

Register items during `x-init` on the client. Control visibility with `x-show` (or your own CSS).

## Limitations

- With `exclusive: true` (default), only one menu is open at a time — suitable for dropdowns and context menus
- Put `@click.outside` on a wrapper that includes the trigger — not on the menu panel alone, or opening clicks will dismiss immediately
- For teleported menus, use `@click.window` + `handleOutsideClick()` so outside clicks ignore both trigger and panel
- Wire `@keydown.window` while the menu is open; `@keydown` on the panel alone misses keys when focus stays on the trigger
- With multiple menus on one page, use `handleWindowOutsideClick($event, menuIds)` and `handleWindowKeydown($event, menuIds)` on `@keydown.window` / `x-on:click.window`
- Use `<template x-teleport="body">` with `bindTrigger()` + `bindMenu()` when the menu sits inside `overflow-hidden` ancestors
- Call `bindMenu()` on the menu root so arrow keys move roving focus to the active item
- Position with `@alpinejs/anchor` — the store does not set `top` / `left`
