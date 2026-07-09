---
title: "Menu"
description: "Package: @ailuracode/alpine-menu"
---

Package: `@ailuracode/alpine-menu`

Headless menu store for dropdowns and context menus. Keyboard navigation (`Arrow*`, `Home`, `End`, `Enter`, `Space`, `Escape`), roving tabindex, and ARIA helpers. **Only one menu open at a time by default** — opening a menu closes any other open menu. **No HTML or CSS is shipped.**

## Install

```bash
npm install @ailuracode/alpine-menu alpinejs
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
  onLockChange(locked) {
    locked ? Alpine.store("scroll").lock() : Alpine.store("scroll").unlock();
  },
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
| `onLockChange` | — | `(locked: boolean) => void` while menus are open |

## Exclusive mode

By default (`exclusive: true`), `open(id)` and `toggle(id)` close every other open menu before opening the target. This is the expected behavior for **dropdown menus**, **context menus**, and similar overlays where only one panel should be visible.

```js
// Default — no config needed
Alpine.plugin(menu());
```

When a second menu opens, the first closes automatically. Scroll lock (`onLockChange`) stays in sync: replacing one open menu with another does not briefly unlock the page.

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

  <template x-teleport="#overlay-root">
    <ul
      x-bind="$store.menu.menuProps('user-menu')"
      x-init="$store.menu.bindMenu('user-menu', $el)"
      x-show="$store.menu.isOpen('user-menu')"
      :style="{ zIndex: $store.overlay.zIndexOf('menu', 'user-menu') }"
      x-anchor.bottom-start.offset.8.fixed="$refs.menuTrigger"
      class="min-w-48"
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

## Stacking & z-index (overlay)

Menus are frequently the **first thing** to z-fight with dialogs and
tooltips. When you load `@ailuracode/alpine-overlay`, the teleported
panel reads its `z-index` from `$store.overlay.zIndexOf('menu', id)`
so concurrent menus (and any modals) share a single scale:

```html
<template x-teleport="#overlay-root">
  <ul
    :style="{ zIndex: $store.overlay.zIndexOf('menu', 'user-menu') }"
    x-anchor.bottom-start.offset.8.fixed="$refs.menuTrigger"
    class="min-w-48"
  >
    <!-- items -->
  </ul>
</template>
```

Register `Alpine.plugin(overlayPlugin())` **before** menu in your
entrypoint so the portal root is created synchronously, otherwise
`x-teleport="#overlay-root"` silently no-ops. Drop the old
`z-50` / `z-[N]` from the panel — `style.zIndex` wins specificity.

Soft-peer fallback: keep `x-teleport="body"` + the legacy utility
class if you do not load overlay. See
[Overlay → When NOT to use](./overlay.md#when-not-to-use-overlay).

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
