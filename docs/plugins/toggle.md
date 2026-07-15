---
title: "Toggle"
description: "Binary and ternary state machines with the $toggle magic."
---

Package: `@ailuracode/alpine-toggle`

Framework-agnostic state machine for Alpine.js. Callable `$toggle()` magic for **binary** and **ternary** state machines with typed `change` events. Headless — no DOM, no CSS, no storage.

## Tiers

Choose the smallest entrypoint that provides the capabilities you need. All tiers share the `{ value, set, toggle }` contract.

| Tier | Import | API | Gzip | Brotli | Recommended for |
| --- | --- | --- | ---: | ---: | --- |
| Puppy | `@ailuracode/alpine-toggle/puppy` | Binary `value`, `set`, `toggle` | 345 B | 311 B | Trivial binary toggles |
| Doggo | `@ailuracode/alpine-toggle/doggo` | Puppy + custom/ternary states, `is`, `next`, `reset`, `onChange` | 700 B | 643 B | Ternary state and lightweight subscriptions |
| Big Dog | `@ailuracode/alpine-toggle` | Doggo + ids, lifecycle, typed events, `setSilently` | 1,082 B | 959 B | Full controller and hydration needs |

Each entrypoint is built independently, so smaller tiers do not include Big Dog's event emitter, lifecycle, or id generation.

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

`$toggle(options)` returns a **reactive facade** backed by a fresh `ToggleController` per call. Each command forwards to the controller; the plugin subscribes a bridge to the typed `change` event so every transition fires Alpine's `set` trap and templates re-render.

### Options

| Option                  | Type     | Description                                                              |
|-------------------------|----------|--------------------------------------------------------------------------|
| `states.on`             | `A`      | First opposite state (required)                                           |
| `states.off`            | `B`      | Second opposite state (required)                                          |
| `states.indeterminate`  | `N`      | Optional independent third state                                          |
| `initial`               | value    | Starting value (defaults to `on` in binary, `indeterminate` in ternary)  |
| `id`                    | `string` | Stable identifier (auto-generated as `toggle-<n>`)                        |

### Facade returned by `$toggle(...)`

The facade extends `ToggleInstance` with lifecycle flags and the hydration escape hatch:

| Member                  | Description                                                                  |
|-------------------------|------------------------------------------------------------------------------|
| `value`                 | Current state (narrow union — binary omits `undefined`)                      |
| `states`                | View `{ on, off, indeterminate }` (binary: `indeterminate` is `undefined`)  |
| `is(value)`             | Whether `value` is the current state                                         |
| `set(value)`            | Sets the state — no-op if the value is unchanged or not in `states`          |
| `setSilently(value)`    | Sets the state without emitting `change` (hydration); facade still updates   |
| `toggle()`              | Flips between `on` and `off`; from `indeterminate` jumps to `on`             |
| `next()`                | Advances through every state in declaration order                            |
| `reset()`               | Restores `initial`                                                          |
| `id`                    | Stable controller identifier (auto-generated)                               |
| `isMounted`             | `true` after `mount()` has run                                              |
| `isDestroyed`           | `true` after the controller was destroyed                                    |

See the [package README](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme) for the full architecture and reactivity wiring.

## Examples

### Binary

```html
<div x-data="{ power: $toggle({ states: { on: 'visible', off: 'hidden' } }) }">
  <p x-show="power.is(power.states.on)">Shown</p>
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

### Ternary — when you genuinely need a third state

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

### Persist via `setSilently`

Use `setSilently` from `x-init` to seed from `localStorage` without firing a stray `'user'` event:

```html
<div
  x-data="{
    mode: $toggle({ states: { on: 'on', off: 'off' } }),
    init() {
      const persisted = localStorage.getItem('mode');
      if (persisted) this.mode.setSilently(persisted);
    },
  }"
>
  <span x-text="mode.value"></span>
  <button
    type="button"
    @click="mode.toggle(); localStorage.setItem('mode', mode.value)"
  >
    Toggle
  </button>
</div>
```

## `change` events

```ts
import { createToggle, type ToggleChangeDetail } from "@ailuracode/alpine-toggle";

const answer = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

answer.on("change", (detail: ToggleChangeDetail<"yes", "no", "unknown">) => {
  console.log(detail.current, detail.previous, detail.source);
});
```

`detail.source` is one of `'initialization'` (first emit, `previous: null`), `'user'` (`set` / `toggle` / `next`), or `'reset'` (`reset()`).

## Standalone controller

The controller is also exposed without Alpine for tests, vanilla TS widgets, or SSR:

```ts
import { createToggle, ToggleController } from "@ailuracode/alpine-toggle";

const power = createToggle({ states: { on: "on", off: "off" }, id: "power" });
power.id;          // "power"
power.isMounted;   // true (createToggle calls mount() internally)
power.on("change", (detail) => console.log(detail));
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
