---
title: "Virtual"
description: "Package: @ailuracode/alpine-virtual"
---

Package: `@ailuracode/alpine-virtual`

Headless virtual list controller for Alpine.js. Calculates visible ranges, item offsets, and scroll commands without rendering markup — inspired by [TanStack Virtual](https://tanstack.com/virtual).

## Install

```bash
pnpm add @ailuracode/alpine-virtual alpinejs @ailuracode/alpine-core
```

## Setup

```js
import Alpine from "alpinejs";
import virtual from "@ailuracode/alpine-virtual";

Alpine.plugin(virtual());
Alpine.start();
```

## Store API

| Method | Description |
|--------|-------------|
| `create(id, options?)` | Register a virtual list instance |
| `bindScrollElement(id, element)` | Attach the scroll container (`window` when `scrollMode: 'window'`) |
| `destroy(id)` | Remove an instance |
| `setCount(id, count)` | Update item count for dynamic collections |
| `setKeys(id, keys)` | Replace stable keys when data is reordered |
| `measureItem(id, index, size)` | Report measured size for variable rows |
| `scrollToIndex(id, index, options?)` | Scroll with `align` (`start` / `center` / `end` / `auto`) and `behavior` |
| `scrollToOffset(id, offset, options?)` | Scroll to a pixel offset |
| `listProps` / `itemProps` / `contentProps` | Headless ARIA + `data-virtual-*` attributes |

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `count` | `0` | Number of items |
| `horizontal` | `false` | Horizontal virtualization |
| `estimateSize` | `50` | Estimated item size before measurement |
| `overscan` | `1` | Extra items rendered outside the viewport |
| `paddingStart` / `paddingEnd` | `0` | Content padding |
| `gap` | `0` | Gap between items |
| `scrollMode` | `'element'` | `'element'` or `'window'` |
| `getItemKey` | `index` | Stable key extractor |

## Accessibility

Virtual lists remove offscreen rows from the DOM. Keyboard focus must not land on unmounted items.

- Call `scrollToIndex` before focusing a row that may be offscreen.
- Preserve `aria-setsize` and `aria-posinset` via `itemProps`.
- For composite widgets (listbox, grid), coordinate with selection primitives so the active item stays mounted.

## Standalone controller

```ts
import { createVirtualController } from "@ailuracode/alpine-virtual";

const controller = createVirtualController();
controller.create("logs", { count: 5000, estimateSize: 24 });
controller.on("rangeChange", ({ virtualItems }) => {
  render(virtualItems);
});
```

## License

MIT
