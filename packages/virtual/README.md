# @ailuracode/alpine-virtual

Headless virtual list controller for Alpine.js — TanStack Virtual-style range calculation without rendering markup.

## Install

```bash
pnpm add @ailuracode/alpine-virtual alpinejs @ailuracode/alpine-core
```

## Quick start

```ts
import Alpine from "alpinejs";
import virtual from "@ailuracode/alpine-virtual";

Alpine.plugin(virtual());
Alpine.start();
```

```html
<div
  x-data="{ items: Array.from({ length: 10000 }, (_, i) => ({ id: i, label: `Row ${i}` })) }"
  x-init="
    $store.virtual.create('list', { count: items.length, estimateSize: 36, overscan: 4 });
    $nextTick(() => {
      const el = $el.querySelector('[data-virtual-scroll]');
      if (el) $store.virtual.bindScrollElement('list', el);
    });
  "
>
  <div
    data-virtual-scroll
    class="h-64 overflow-auto"
    x-bind="$store.virtual.listProps('list', { label: 'Virtual list' })"
  >
    <div x-bind="$store.virtual.contentProps('list')">
      <template x-for="item in $store.virtual.instances.list?.virtualItems ?? []" :key="item.key">
        <div
          x-bind="$store.virtual.itemProps('list', item.index)"
          class="absolute left-0 top-0 w-full"
          :style="`transform: translateY(${item.start}px); height: ${item.size}px`"
          x-text="items[item.index].label"
        ></div>
      </template>
    </div>
  </div>
</div>
```

## Store API

- `$store.virtual.create(id, options)` — register a virtual list instance
- `$store.virtual.bindScrollElement(id, element)` — attach scroll container (or `window` when `scrollMode: 'window'`)
- `$store.virtual.instances[id].virtualItems` — visible items with `start`, `end`, `size`, `key`
- `$store.virtual.measureItem(id, index, size)` — report measured size for variable rows
- `$store.virtual.scrollToIndex(id, index, { align, behavior })` — programmatic scroll
- `$store.virtual.listProps` / `itemProps` / `contentProps` — headless ARIA + data attributes

## Controller API (no Alpine)

```ts
import { createVirtualController } from "@ailuracode/alpine-virtual";

const controller = createVirtualController();
controller.create("logs", { count: 5000, estimateSize: 24 });
controller.on("rangeChange", ({ virtualItems }) => {
  render(virtualItems);
});
```

### Avoiding name collisions

If your application already owns a `$store.virtual` — or another toolkit plugin registers on that name — rename the integration surface without touching the controller:

```ts
Alpine.plugin(virtualPlugin({ storeKey: "windowed" })); // → $store.windowed
```

The exposed constant `DEFAULT_VIRTUAL_STORE_KEY` keeps the rename discoverable from TypeScript.

## Accessibility

Offscreen rows are not in the DOM. Do not move keyboard focus to unmounted items — use `scrollToIndex` to bring the active row into the visible range before focusing.

## License

MIT
