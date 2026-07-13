# @ailuracode/alpine-accordion

Headless accessible accordion store for Alpine.js — single or multiple open panels, keyboard focus, and ARIA helpers.

**[Full documentation →](../../docs/plugins/accordion.md)**

## Install

```bash
pnpm add @ailuracode/alpine-accordion alpinejs
```

Open panel state is backed by an inline lightweight state — no extra dependency.

## Store API

```ts
$store.accordion.register("faq", { mode: "single", defaultOpen: "item-1" });
$store.accordion.open("faq", "item-1");
$store.accordion.toggle("faq", "item-1");
$store.accordion.isOpen("faq", "item-1");
$store.accordion.openIds("faq");
```

Modes: `single` (one panel open) or `multiple` (several panels). Use `defaultOpen` with a string or string array. Animate panels with `@alpinejs/collapse` (`x-show` + `x-collapse` on an outer wrapper; put padding on an inner element).
