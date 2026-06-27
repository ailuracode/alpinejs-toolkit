# @ailuracode/alpinejs-toggle

Alpine.js magic for **binary** and **ternary** toggles with full TypeScript inference.

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

## Usage

Each call to `$toggle()` returns an independent reactive instance.

### Binary (two opposite states)

```html
<div x-data="{ power: $toggle({ states: { truly: 'on', falsely: 'off' }, initial: 'off' }) }">
  <p x-text="power.value"></p>
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

```ts
const power = createToggle({ states: { truly: "on", falsely: "off" } });
power.ternary; // undefined
```

### Ternary (two opposites + one independent state)

The third state is **independent** — `toggle()` only flips between `truly` and `falsely`. Use `cycle()` to visit all three.

```html
<div x-data="{ answer: $toggle({
  states: { truly: 'yes', falsely: 'no', ternary: 'unknown' },
  initial: 'unknown',
}) }">
  <p>
    Value: <strong x-text="answer.value"></strong>
    <span x-show="answer.is(answer.ternary)" class="badge">neutral</span>
  </p>
  <button type="button" @click="answer.toggle()">Yes / No</button>
  <button type="button" @click="answer.cycle()">Cycle all</button>
  <button type="button" @click="answer.set(answer.ternary)">Reset to unknown</button>
</div>
```

```ts
const answer = createToggle({
  states: { truly: "yes", falsely: "no", ternary: "unknown" },
});
```

Without `states.ternary`, the property defaults to `undefined`:

```ts
const power = createToggle({ states: { truly: "on", falsely: "off" } });
power.ternary; // undefined
```

## API

### Options

| Option | Type | Description |
|--------|------|-------------|
| `states.truly` | `TA` | First opposite state |
| `states.falsely` | `TB` | Second opposite state |
| `states.ternary` | `TN` | Optional independent state (`undefined` by default) |
| `initial` | value | Starting value (default: `truly`, or `ternary` when configured) |

### Instance

| Member | Description |
|--------|-------------|
| `value` | Current state |
| `states` | Readonly object `{ truly, falsely, ternary }` |
| `truly` / `falsely` / `ternary` | Shorthand for `states.*` |
| `is(value)` | Whether `value` is active |
| `set(value)` | Set state; returns `false` if unchanged or invalid |
| `toggle()` | Flip between opposites (from ternary → `truly`) |
| `cycle()` | Advance to the next state in order |
| `reset()` | Restore `initial` |

## Types

```ts
import { createToggle, type ToggleValue } from "@ailuracode/alpinejs-toggle";

type OnOff = ToggleValue<"on", "off">;
type Answer = ToggleValue<"yes", "no", "unknown">;
```

Add `/// <reference path="node_modules/@ailuracode/alpinejs-toggle/dist/global.d.ts" />` for `$toggle` in templates.

## License

MIT
