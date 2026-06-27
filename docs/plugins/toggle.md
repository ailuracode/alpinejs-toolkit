---
title: "Toggle"
description: "Package: @ailuracode/alpinejs-toggle"
---

Package: `@ailuracode/alpinejs-toggle`

Callable magic `$toggle()` for **binary** and **ternary** state machines with inferred TypeScript unions.

## Install

```bash
npm install @ailuracode/alpinejs-toggle alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import toggle from "@ailuracode/alpinejs-toggle";

Alpine.plugin(toggle);
Alpine.start();
```

## Magic API

`$toggle(options)` returns a reactive instance per call (like `$calendar()`).

### Options

| Option | Type | Description |
|--------|------|-------------|
| `states.truly` | `A` | First opposite state (required) |
| `states.falsely` | `B` | Second opposite state (required) |
| `states.ternary` | `N` | Optional independent third state |
| `initial` | value | Starting value |

### Instance

| Member | Description |
|--------|-------------|
| `value` | Current state |
| `states` | `{ truly, falsely, ternary }` object |
| `toggle()` | Flip between opposites; from ternary → `truly` |
| `cycle()` | Advance through all active states |
| `set(value)` / `reset()` / `is(value)` | State helpers |
| `truly` / `falsely` / `ternary` | Shorthand accessors |

## Examples

### Binary

```html
<div x-data="{ t: $toggle({ states: { truly: 'visible', falsely: 'hidden' } }) }">
  <p x-show="t.is(t.truly)">Shown</p>
  <button type="button" @click="t.toggle()">Toggle</button>
</div>
```

### Ternary

```html
<div x-data="{ t: $toggle({
  states: { truly: 'yes', falsely: 'no', ternary: 'unknown' },
  initial: 'unknown',
}) }">
  <span x-show="t.is(t.truly)">Yes</span>
  <span x-show="t.is(t.falsely)">No</span>
  <span x-show="t.is(t.ternary)">Unknown</span>
  <button type="button" @click="t.toggle()">Yes / No</button>
  <button type="button" @click="t.cycle()">Cycle</button>
</div>
```

## TypeScript

```ts
import { createToggle, type ToggleValue } from "@ailuracode/alpinejs-toggle";

const binary = createToggle({ states: { truly: "on", falsely: "off" } });
binary.ternary; // undefined

const ternary = createToggle({
  states: { truly: "yes", falsely: "no", ternary: "unknown" },
});
type Answer = ToggleValue<"yes", "no", "unknown">;
```

## See also

- [Getting started](../getting-started.md)
- [Calendar](./calendar.md) — similar callable magic pattern
