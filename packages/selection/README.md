# @ailuracode/alpine-selection

Framework-agnostic selection primitives for Alpine.js — single, multiple, and range modes with anchor tracking.

**[Full documentation →](../../docs/plugins/selection.md)**

## Install

```bash
pnpm add @ailuracode/alpine-selection alpinejs @ailuracode/alpine-core
```

## Quick example

```ts
import Alpine from "alpinejs";
import selection from "@ailuracode/alpine-selection";

Alpine.plugin(selection());
Alpine.start();
```

```html
<div
  x-data="{
    items: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    itemClass(key) {
      const snap = $store.selection.instances.list;
      if (!snap) return '';
      return snap.selectedKeys.includes(key) ? 'is-selected' : '';
    },
  }"
  x-init="$store.selection.create('list', { mode: 'multiple', keys: items })"
>
  <p x-text="$store.selection.instances.list?.selectedKeys.join(', ') || 'none'"></p>
  <ul x-bind="$store.selection.listProps('list', { label: 'Choose items' })">
    <template x-for="item in items" :key="item">
      <li
        x-bind="$store.selection.itemProps('list', item)"
        :class="itemClass(item)"
        @click="$store.selection.toggle('list', item)"
        x-text="item"
      ></li>
    </template>
  </ul>
</div>
```

Bind styles and labels to `$store.selection.instances[id]` (or `itemProps` / `listProps`) so Alpine tracks selection changes. Imperative helpers such as `isSelected()` read the controller directly and do not trigger template updates on their own.

In inline `x-data` methods, reference component fields with `this` (or run `create` from an `x-init` expression where Alpine injects data scope):

```html
<div
  x-data="{ items: ['Alpha', 'Bravo'], mode: 'multiple' }"
  x-init="$store.selection.create('list', { mode, keys: items })"
>
```

## Store API

- `$store.selection.create(id, options)` — register a selection instance
- `$store.selection.replace(id, key)` — replace selection
- `$store.selection.toggle(id, key)` — toggle membership (multiple mode)
- `$store.selection.extend(id, key)` — extend from anchor (range / shift-click)
- `$store.selection.selectAll(id)` / `clear(id)` — bulk commands
- `$store.selection.setActive(id, key)` / `setAnchor(id, key)` — keyboard / pointer focus
- `$store.selection.instances[id]` — readonly snapshot (`value`, `selectedKeys`, `anchorKey`, `activeKey`, `mode`)
- `$store.selection.listProps` / `itemProps` — headless listbox ARIA helpers (reactive via `instances`)

## Navigation helpers

```ts
import {
  moveSelectableIndex,
  moveSelectableKey,
  firstSelectableIndex,
  lastSelectableKey,
} from "@ailuracode/alpine-selection";

const next = moveSelectableIndex(keys, currentIndex, "next", { disabledKeys });
```

Use these in keyboard handlers for listbox, command palette, and tab strips.

## Controller API (no Alpine)

```ts
import { createSelectionController } from "@ailuracode/alpine-selection";

const controller = createSelectionController();
controller.create("rows", { mode: "range", keys: ["a", "b", "c"] });
controller.on("change", ({ selectedKeys }) => {
  render(selectedKeys);
});
```

## Serialization

```ts
import { serializeSelection, deserializeSelection } from "@ailuracode/alpine-selection";

const encoded = serializeSelection(["a", "c"], "multiple");
const restored = deserializeSelection(encoded, "multiple");
```

## Used by

`@ailuracode/alpine-calendar`, `@ailuracode/alpine-command`, `@ailuracode/alpine-tabs`, and `@ailuracode/alpine-accordion` build on these primitives internally.

## License

MIT
