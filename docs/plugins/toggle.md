---
title: "Toggle"
description: "Package: @ailuracode/alpine-toggle"
---

Package: `@ailuracode/alpine-toggle`

Framework-agnostic state machine for Alpine.js. Callable magic `$toggle()` for **binary** and **ternary** state machines with typed `change` events.

## Install

```bash
pnpm add @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import { togglePlugin } from "@ailuracode/alpine-toggle";

Alpine.plugin(togglePlugin());
Alpine.start();
```

## Magic API

`$toggle(options)` returns a reactive `ToggleController` per call. Every command is forwarded to the controller — see the [package README](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme) for the full architecture overview.

### Options

| Option                | Type     | Description                                                           |
|-----------------------|----------|-----------------------------------------------------------------------|
| `states.on`           | `A`      | First opposite state (required)                                       |
| `states.off`          | `B`      | Second opposite state (required)                                      |
| `states.indeterminate`| `N`      | Optional independent third state                                      |
| `initial`             | value    | Starting value (defaults to `on` for binary, `indeterminate` for ternary) |

### Instance

| Member                  | Description                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| `value`                 | Current state                                                               |
| `states`                | `{ on, off, indeterminate }` view                                           |
| `is(value)`             | Whether `value` is the current state                                         |
| `set(value)`            | Silently sets the state — no-op when value is unchanged or invalid         |
| `toggle()`              | Flips between `on` and `off`; from `indeterminate` it moves to `on`         |
| `next()`                | Advances through every state in declaration order                          |
| `reset()`               | Restores `initial`                                                          |
| `on('change', listener)`| Subscribes to transitions; detail = `{ current, previous, source }`        |
| `destroy()`             | Idempotent — releases every listener                                        |

## Examples

### Binary

```html
<div x-data="{ power: $toggle({ states: { on: 'visible', off: 'hidden' } }) }">
  <p x-show="power.is(power.states.on)">Shown</p>
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

### Ternary — when you need a third state

```html
<div x-data="{ answer: $toggle({
  states: { on: 'yes', off: 'no', indeterminate: 'unknown' },
  initial: 'unknown',
}) }">
  <span x-show="answer.is(answer.states.on)">Yes</span>
  <span x-show="answer.is(answer.states.off)">No</span>
  <span x-show="answer.is(answer.states.indeterminate)">Unknown</span>
  <button type="button" @click="answer.toggle()">Yes / No</button>
  <button type="button" @click="answer.next()">Cycle</button>
</div>
```

### Change events

```ts
import { createToggle, type ToggleChangeDetail } from "@ailuracode/alpine-toggle";

const answer = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

answer.on("change", (detail: ToggleChangeDetail<"yes", "no", "unknown">) => {
  console.log(detail.current, detail.previous, detail.source);
});
```

## TypeScript

```ts
import { createToggle, type ToggleInstance } from "@ailuracode/alpine-toggle";

const binary = createToggle({ states: { on: "on", off: "off" } });
binary.states.indeterminate; // undefined

const ternary = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

const instance: ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown"> = ternary;
```

## See also

- [Getting started](../getting-started.md)
- [Theme](./theme.md) — companion store with the same controller-based architecture