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

## Store API

| Method | Description |
|--------|-------------|
| `create(id, options?)` | Register a selection instance |
| `replace(id, key)` | Replace the current selection |
| `toggle(id, key)` | Toggle membership in multiple mode |
| `extend(id, key)` | Extend from the anchor (range / shift-click) |
| `selectAll(id)` / `clear(id)` | Bulk selection commands |
| `setMode(id, mode)` | Switch between `single`, `multiple`, and `range` |
| `setKeys(id, keys)` | Update the ordered key registry |
| `instances[id]` | Readonly snapshot (`value`, `selectedKeys`, `anchorKey`, `activeKey`) |
| `listProps` / `itemProps` | Headless listbox ARIA helpers |

## Modes

| Mode | Value shape | Typical use |
|------|-------------|-------------|
| `single` | `key \| null` | Listbox, radio group |
| `multiple` | `key[]` | Multi-select tables, checklists |
| `range` | `{ from, to? }` | Shift-click ranges, calendars |

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

## Accessibility

Use `listProps` and `itemProps` for WAI-ARIA listbox semantics. Pair keyboard handlers with `setActive` and `extend` for shift-arrow range selection in your markup.
