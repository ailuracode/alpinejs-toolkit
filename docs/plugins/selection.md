---
title: "Selection"
description: "Package: @ailuracode/alpine-selection"
---

Package: `@ailuracode/alpine-selection`

Framework-agnostic selection primitives for Alpine.js. Single, multiple, and range modes with anchor tracking, disabled items, and optional serialization — without rendering markup.

## Install

```bash
pnpm add @ailuracode/alpine-selection alpinejs @ailuracode/alpine-core
```

## Setup

```js
import Alpine from "alpinejs";
import selection from "@ailuracode/alpine-selection";

Alpine.plugin(selection());
Alpine.start();
```

## Reactivity in templates

Selection state is mirrored on `$store.selection.instances[id]`. Read from that snapshot (or use `listProps` / `itemProps`, which derive from it) so Alpine re-renders when selection changes:

```html
<p x-text="$store.selection.instances.rows?.selectedKeys.join(', ')"></p>
```

`isSelected()`, `isActive()`, and similar helpers are for imperative code (event handlers, tests). They do not register reactive dependencies in templates.

## Store API

| Method | Description |
|--------|-------------|
| `create(id, options?)` | Register a selection instance |
| `destroy(id)` / `destroyAll()` | Remove instance(s) |
| `replace(id, key)` | Replace the current selection |
| `toggle(id, key)` | Toggle membership in multiple mode |
| `extend(id, key)` | Extend from the anchor (range / shift-click) |
| `selectAll(id)` / `clear(id)` | Bulk selection commands |
| `setMode(id, mode)` | Switch between `single`, `multiple`, and `range` |
| `setKeys(id, keys)` | Update the ordered key registry |
| `setDisabledKeys(id, keys)` | Mark keys as non-selectable |
| `setActive(id, key)` / `setAnchor(id, key)` | Update focus / range anchor |
| `instances[id]` | Readonly snapshot (`value`, `selectedKeys`, `anchorKey`, `activeKey`, `mode`) |
| `listProps` / `itemProps` | Headless listbox ARIA helpers |

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `mode` | `"single"` | `single`, `multiple`, or `range` |
| `keys` | `[]` | Ordered selectable keys (defines range span order) |
| `disabledKeys` | `[]` | Keys that cannot be selected |
| `allowDisabledSelection` | `false` | Allow selecting disabled keys programmatically |
| `value` / `defaultValue` | — | Controlled or initial value |
| `onChange` | — | Called after each confirmed transition |

## Modes

| Mode | Value shape | Typical use |
|------|-------------|-------------|
| `single` | `key \| null` | Listbox, radio group, tabs |
| `multiple` | `key[]` | Multi-select tables, checklists |
| `range` | `{ from, to? }` | Shift-click ranges, calendars |

## Pointer interactions

| Gesture | Command |
|---------|---------|
| Click | `replace(id, key)` |
| Ctrl/Cmd + click | `toggle(id, key)` (multiple) |
| Shift + click | `extend(id, key)` (range / multiple) |

Call `setActive(id, key)` on pointer down or click so `activeKey` stays in sync for keyboard continuation.

## Navigation helpers

Exported for keyboard handlers in listboxes, command palettes, and similar widgets:

```ts
import {
  moveSelectableIndex,
  moveSelectableKey,
  firstSelectableIndex,
  lastSelectableIndex,
  firstSelectableKey,
  lastSelectableKey,
} from "@ailuracode/alpine-selection";

const nextIndex = moveSelectableIndex(keys, currentIndex, "next", { disabledKeys });
const nextKey = moveSelectableKey(keys, currentKey, "next", { disabledKeys });
```

## Controller (no Alpine)

```ts
import { createSelectionController } from "@ailuracode/alpine-selection";

const controller = createSelectionController();
controller.create("rows", { mode: "multiple", keys: ["a", "b", "c"] });
controller.on("change", ({ selectedKeys }) => {
  console.log(selectedKeys);
});
```

## Serialization

```ts
import { serializeSelection, deserializeSelection } from "@ailuracode/alpine-selection";

serializeSelection(["a", "c"], "multiple"); // "a,c"
deserializeSelection("a..c", "range"); // { from: "a", to: "c" }
```

URL helpers: `parseSelectionParam`, `writeSelectionParam`.

## Accessibility

Use `listProps` and `itemProps` for WAI-ARIA listbox semantics (`role`, `aria-selected`, `aria-disabled`, `aria-multiselectable`). Pair keyboard handlers with `setActive`, `moveSelectableKey`, and `extend` for arrow-key and shift-arrow range selection.

## Adoption in the toolkit

These packages use `@ailuracode/alpine-selection` internally:

| Package | Use |
|---------|-----|
| `@ailuracode/alpine-tabs` | Active tab as single selection |
| `@ailuracode/alpine-accordion` | Open panels as single/multiple selection |
| `@ailuracode/alpine-command` | Active item index navigation |
| `@ailuracode/alpine-calendar` | Date keys bridged to ISO strings |

Consumers of those packages do not need to install `@ailuracode/alpine-selection` unless they use selection primitives directly.

## License

MIT
