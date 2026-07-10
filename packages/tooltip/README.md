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
