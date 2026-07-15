# @ailuracode/alpine-toggle

Framework-agnostic state machine for Alpine.js. Two required opposite states (`on`, `off`) and an optional independent state (`indeterminate`). Returns a reactive, evented, lifecycle-aware controller per call — no DOM, no storage, no system observers. Built on `@ailuracode/alpine-core`'s `BaseController`.

## Capability tiers (PoC)

The package ships three entrypoints. Pick the smallest tier that fits your use case. All variants register the same `$toggle` magic — only the imported plugin changes.

| Variant | Import | Best for | API surface |
| ------- | ------ | -------- | ----------- |
| **Puppy** | `@ailuracode/alpine-toggle/puppy` | Boolean on/off only | `value`, `set()`, `toggle()` |
| **Doggo** | `@ailuracode/alpine-toggle/doggo` | Reusable app state with custom values | Puppy + `states`, `is()`, `next()`, `reset()`, `onChange()` |
| **Big Dog** | `@ailuracode/alpine-toggle` | Full lifecycle, hydration, typed events | Doggo + `on()`, `once()`, `mount()`, `destroy()`, `setSilently()`, IDs |

```ts
import puppyTogglePlugin from "@ailuracode/alpine-toggle/puppy";
import doggoTogglePlugin from "@ailuracode/alpine-toggle/doggo";
import { togglePlugin } from "@ailuracode/alpine-toggle"; // Big Dog
```

```html
<!-- Puppy -->
<div x-data="{ power: $toggle(false) }">
  <button type="button" @click="power.toggle()">Toggle</button>
</div>

<!-- Doggo / Big Dog -->
<div x-data="{ power: $toggle({ states: { on: 'on', off: 'off' } }) }">
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

Code written against the shared contract (`value`, `set()`, `toggle()`) keeps working when you upgrade tiers.

### PoC bundle comparison

Independent `size-limit` budgets validate that smaller entrypoints exclude larger implementations. Run `pnpm --filter @ailuracode/alpine-toggle run size` after `pnpm run build` for current numbers.

| Variant | API surface | Gzip | Brotli | Internal duplication | Recommendation |
| ------- | ----------- | ---- | ------ | -------------------- | -------------- |
| Puppy | Minimal boolean | 263 B | 202 B | Shared `internal/transitions` + `validation` only | **Adopt** for boolean-only consumers |
| Doggo | Balanced custom states | 607 B | 447 B | Reuses pure helpers; separate controller from Big Dog | **Adopt** when events/lifecycle are unnecessary |
| Big Dog | Full | 926 B | 750 B | Baseline | **Keep** as root — existing API unchanged |

**PoC conclusion:** The tiered model produces meaningful bundle savings without inheritance or runtime feature flags. Puppy and Doggo are separate implementations that share only small pure helpers, so tree-shaking keeps each entrypoint isolated. Recommend shipping `/puppy` and `/doggo` subpaths alongside the unchanged root export.

## Architecture

```mermaid
flowchart TD
    entry["createToggle()<br/>(controller.ts)"]:::entry

    options["ToggleOptions<br/>(types.ts)"]:::module
    validation["validation<br/>(internal/validation.ts)"]:::module
    events["ToggleEvents<br/>(events.ts)"]:::module

    classDef entry fill:#fef3c7,stroke:#b45309,color:#1f2937
    classDef module fill:#dbeafe,stroke:#1d4ed8,color:#1f2937

    entry --> options
    entry --> validation
    entry --> events
```

The core is engine-free: no Alpine import, no DOM mutation, no `window`/`document`/`localStorage` access at any time. The Alpine integration is a thin adapter that wires the controller into `$toggle` magic.

## State model

Two cases, one shape:

| Field                    | Meaning                                                              | Required                                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------- |
| `states.on`              | The first opposite state                                             | **yes** — binary case                     |
| `states.off`             | The second opposite state                                            | **yes** — binary case                     |
| `states.indeterminate`   | An independent third state (skipped by `toggle()`, walked by `next()`) | no — opt-in, only when genuinely needed   |
| `initial`                | Starting value                                                       | optional — defaults to `on`               |

**The binary case is the default.** Most consumers only need `on` and `off`; that is what `toggle()`, `set()`, and `next()` cover. Add `indeterminate` only when the third value is genuinely outside the on/off opposition (tri-state checkboxes, `'loading'` placeholders, `'unknown'` answers).

`toggle()` flips between `on` and `off`. From `indeterminate` it moves to `on` — never the other way around. `next()` advances through every configured state in declaration order (`on` → `off` → `indeterminate` → `on`).

## Install

```bash
pnpm add @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Standalone usage (no Alpine)

```ts
import { createToggle } from "@ailuracode/alpine-toggle";

const power = createToggle({ states: { on: "on", off: "off" } });
power.toggle();
power.reset();

power.on("change", (detail) => {
  // detail: { current, previous, source: 'user' | 'reset' | 'initialization' }
  console.log(detail.current, detail.previous, detail.source);
});
```

## Alpine usage

```ts
import Alpine from "alpinejs";
import { togglePlugin } from "@ailuracode/alpine-toggle";

Alpine.plugin(togglePlugin());
Alpine.start();
```

```html
<div x-data="{ power: $toggle({ states: { on: 'on', off: 'off' } }) }">
  <p>Power: <strong x-text="power.value"></strong></p>
  <button type="button" @click="power.toggle()">Toggle</button>
  <button type="button" @click="power.reset()">Reset</button>
</div>
```

Each `$toggle(options)` call returns an independent reactive instance backed by a fresh `ToggleController`. Mutations flow through `Alpine.reactive`, so templates re-render on every change.

### Ternary — when you genuinely need a third state

```html
<div x-data="{ answer: $toggle({
  states: { on: 'yes', off: 'no', indeterminate: 'unknown' },
  initial: 'unknown',
}) }">
  <p>Answer: <strong x-text="answer.value"></strong></p>
  <button type="button" @click="answer.toggle()">Yes / No</button>
  <button type="button" @click="answer.next()">Cycle</button>
  <button type="button" @click="answer.set(answer.indeterminate)">Reset to unknown</button>
</div>
```

`toggle()` skips `indeterminate` — from `'unknown'` it jumps to `'yes'`. Use `next()` to walk through all three.

## Cleanup

`controller.destroy()` is idempotent and tears down every event listener. The plugin forwards destroy through `Alpine.cleanup` when available, so every controller created by `$toggle(...)` is destroyed when Alpine tears down the runtime.

```ts
const toggle = createToggle({ states: { on: 1, off: 0 } });
const unsubscribe = toggle.on("change", (detail) => { /* ... */ });

unsubscribe(); // stop one listener
toggle.destroy(); // stop every listener — idempotent
```

## TypeScript

```ts
import { createToggle, type ToggleInstance } from "@ailuracode/alpine-toggle";

const binary = createToggle({ states: { on: "on", off: "off" } });
binary.states.indeterminate; // undefined
binary.value; // "on" | "off"

const ternary = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

const instance: ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown"> = ternary;
```

Add `/// <reference path="node_modules/@ailuracode/alpine-toggle/dist/global.d.ts" />` for `$toggle` in templates.

## API reference

```ts
const toggle = createToggle({
  states: { on: T, off: T, indeterminate?: T },
  initial?: T,
  id?: string,
});

toggle.value          // current state
toggle.states         // { on, off, indeterminate }
toggle.is(value)      // boolean — strict equality against the current value
toggle.set(value)     // void — silently no-ops on invalid / unchanged input
toggle.setSilently(value) // void — sets without emitting (use for hydration)
toggle.toggle()       // flips on ↔ off; from indeterminate → on
toggle.next()         // advances through [on, off, indeterminate]
toggle.reset()        // restores initial
toggle.on('change', listener) // listener({ current, previous, source })
toggle.destroy()      // idempotent, releases listeners
```

```ts
Alpine.plugin(togglePlugin({ id?: string }));
```

`setSilently(value)` is the hydration escape hatch — set the value without broadcasting a transition. Pair it with the queued initialization microtask to seed the controller from an authoritative source (`localStorage`, server-provided state) without producing a spurious `'user'` event:

```ts
const persisted = readPersisted();
const toggle = createToggle({ states: { on, off, indeterminate } });
toggle.setSilently(persisted); // preserved through the init microtask
toggle.on("change", (detail) => persist(detail.current));
```

## SSR

The package is fully importable in a Node runtime. The controller never touches `window`, `document`, or `localStorage`; the Alpine integration only runs when `Alpine.plugin(...)` is called, which the consumer controls.

## Migration from `@ailuracode/alpine-toggle@0.1.x`

`0.2.0` is a breaking rewrite. The public surface changed:

| `0.1.x`                                                          | `0.2.x`                                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `states.truly` / `states.falsely` / `states.ternary`             | `states.on` / `states.off` / `states.indeterminate`                                                |
| `createToggle(options)` returns a plain object                   | `createToggle(options)` returns a `ToggleController` (uses `EventEmitter` from `@ailuracode/alpine-core`) |
| `cycle()`                                                        | `next()` (semantics unchanged — advance through every state in declaration order)                  |
| `set(value)` returns `boolean`                                   | `set(value)` returns `void`; subscribe to `on('change', ...)` for transition notifications        |
| No events                                                        | `change` event with `{ current, previous, source }` detail payload                                 |
| `default export togglePlugin(Alpine) => void`                    | Named `togglePlugin(options?) => Alpine.PluginCallback` factory (matches `themePlugin` shape)      |
| `createToggleMagic()` helper                                     | Removed — the plugin inlines the magic factory; standalone consumers use `createToggle(...)`      |
| No hydration API                                                 | `setSilently(value)` sets without emitting; the queued init microtask preserves any hydrated value |

Prefer the named `togglePlugin` factory — `import { togglePlugin } from "@ailuracode/alpine-toggle"`. The default re-export is retained for compatibility and matches the rest of the toolkit (`themePlugin`, `scrollPlugin`, etc.).

`0.3.0` adds `setSilently()` and tweaks the init microtask to preserve hydrated values — additive only, no breaking changes.

## License

MIT