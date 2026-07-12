# @ailuracode/alpine-selection

Framework-agnostic selection primitives for Alpine.js — single, multiple, and range modes with anchor tracking.

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
  x-data="{ items: ['Alpha', 'Bravo', 'Charlie', 'Delta'] }"
  x-init="$store.selection.create('list', { mode: 'multiple', keys: items })"
>
  <ul x-bind="$store.selection.listProps('list', { label: 'Choose items' })">
    <template x-for="(item, index) in items" :key="item">
      <li
        x-bind="$store.selection.itemProps('list', item)"
        @click="$store.selection.toggle('list', item)"
        x-text="item"
      ></li>
    </template>
  </ul>
</div>
```

## Store API

- `$store.selection.create(id, options)` — register a selection instance
- `$store.selection.replace(id, key)` — replace selection
- `$store.selection.toggle(id, key)` — toggle membership (multiple mode)
- `$store.selection.extend(id, key)` — extend from anchor (range / shift-click)
- `$store.selection.selectAll(id)` / `clear(id)` — bulk commands
- `$store.selection.instances[id]` — readonly snapshot (`value`, `selectedKeys`, `anchorKey`, `activeKey`)
- `$store.selection.listProps` / `itemProps` — headless listbox ARIA helpers

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

## License

MIT
