# @ailuracode/alpine-menu

Headless accessible menu store for Alpine.js — dropdowns, context menus, keyboard navigation, and roving tabindex. No markup or CSS included.

**[Full documentation →](../../docs/plugins/menu.md)**

## Install

```bash
npm install @ailuracode/alpine-menu alpinejs
```

## Setup

```js
Alpine.plugin(
  menu({
    onLockChange(locked) {
      // compose with $store.scroll.lock() / unlock()
    },
  })
);
```

## Store API

```js
$store.menu.open("user-menu");
$store.menu.close("user-menu");
$store.menu.toggle("user-menu");
$store.menu.isOpen("user-menu");
$store.menu.activeItem("user-menu");
```
