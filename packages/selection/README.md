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
- `$store.selection.destroy(id)` / `destroyAll()` — remove instance(s)
- `$store.selection.replace(id, key)` — replace selection
- `$store.selection.toggle(id, key)` — toggle membership (multiple mode)
- `$store.selection.extend(id, key)` — extend from anchor (range / shift-click)
- `$store.selection.selectAll(id)` / `clear(id)` — bulk commands
- `$store.selection.setMode(id, mode)` — switch between `single`, `multiple`, `range`
- `$store.selection.setKeys(id, keys)` — update the ordered key registry
- `$store.selection.setDisabledKeys(id, keys)` — mark keys as non-selectable
- `$store.selection.setActive(id, key)` / `setAnchor(id, key)` — keyboard / pointer focus
- `$store.selection.instances[id]` — readonly snapshot (`value`, `selectedKeys`, `anchorKey`, `activeKey`, `mode`)
- `$store.selection.listProps` / `itemProps` — headless listbox ARIA helpers (reactive via `instances`)

## Store factory (standalone)

Create a store without the full Alpine plugin:

```ts
import { createSelectionStore, createSelectionStoreFromController } from "@ailuracode/alpine-selection";

// Fresh controller
const store = createSelectionStore();
store.create("list", { mode: "multiple", keys: ["a", "b", "c"] });
store.toggle("list", "a");

// Or wrap an existing controller
import { SelectionController } from "@ailuracode/alpine-selection";
const controller = new SelectionController();
const store2 = createSelectionStoreFromController(controller);
```

## Adapter factories

Controlled and uncontrolled adapters for framework-agnostic wiring:

```ts
import { createControlledAdapter, createUncontrolledAdapter } from "@ailuracode/alpine-selection";

// Controlled — you own the value
const adapter = createControlledAdapter({
  mode: "multiple",
  value: ["a"],
  onChange: (detail) => render(detail.value),
});

// Uncontrolled — controller owns the state
const adapter2 = createUncontrolledAdapter(controller, "list", {
  mode: "multiple",
  keys: ["a", "b", "c"],
});
```

## Navigation helpers

```ts
import {
  moveSelectableIndex,
  moveSelectableKey,
  firstSelectableIndex,
  lastSelectableIndex,
  firstSelectableKey,
  lastSelectableKey,
} from "@ailuracode/alpine-selection";

const nextIndex = moveSelectableIndex(currentIndex, 1, selectableFlags);
const nextKey = moveSelectableKey(currentKey, 1, keys, disabledKeys);
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

const encoded = serializeSelection(["a", "c"], "multiple"); // "a,c"
const restored = deserializeSelection(encoded, "multiple");  // ["a", "c"]
```

### URL integration

```ts
import { parseSelectionParam, writeSelectionParam } from "@ailuracode/alpine-selection";

// Read from URL
const params = new URLSearchParams(window.location.search);
const value = parseSelectionParam(params, "selected", "multiple");

// Write to URL
writeSelectionParam(params, "selected", ["a", "c"], "multiple");
window.history.replaceState(null, "", `?${params}`);
```

## Error handling

```ts
import { SelectionError } from "@ailuracode/alpine-selection";

try {
  controller.toggle("unknown-instance", "a");
} catch (e) {
  if (e instanceof SelectionError && e.code === "INSTANCE_NOT_FOUND") {
    // handle missing instance
  }
}
```

## Used by

`@ailuracode/alpine-calendar`, `@ailuracode/alpine-command`, `@ailuracode/alpine-tabs`, and `@ailuracode/alpine-accordion` build on these primitives internally.

## License

MIT
