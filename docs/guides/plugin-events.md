---
title: Plugin DOM events
description: Shared @package:event convention and contributor guidelines for toolkit DOM events.
---

Toolkit packages expose observable behavior to Alpine templates through
namespaced DOM events. Consumers listen with Alpine's `@` syntax; the
underlying event name is `package:event`.

```html
<div
  @toggle:change="handleToggle($event.detail)"
  @dialog:before-close="validateClose($event)"
  @theme:change.window="syncTheme($event.detail)"
></div>
```

> The `@package:event` convention is a **naming and dispatch contract**,
> not a helper. Packages dispatch plain `CustomEvent` instances with
> the namespaced `package:event` type. There is no shared
> `dispatchPluginEvent()` helper anymore — every package builds the
> event itself so its tree-shaking footprint stays predictable.

## Naming rules

| Rule | Example |
| ---- | ------- |
| Toolkit events use `@package:event` | `@menu:activate`, `@selection:change` |
| DOM event name is `package:event` | `menu:activate`, `selection:change` |
| Segments are lowercase kebab-case | `before-close`, not `beforeClose` |
| Pre-action cancelable events use `before-*` | `@dialog:before-close` |
| Package namespace matches the public capability | `toggle`, `dialog`, `theme` |
| Native browser events stay unnamespaced | `@play`, `@focus`, `@scroll` |

Do **not** emit namespaced events that duplicate native DOM events:

```html
<!-- Avoid -->
@media:play
@scroll:scroll
```

A namespaced event is justified only when it represents toolkit-specific
state or lifecycle not already represented by a native event.

## Dispatch shape

```ts
const event = new CustomEvent<DialogCloseDetail>("dialog:close", {
  detail: { previous: true, current: false, source: "api" },
  bubbles: true,
  composed: true,
});

element.dispatchEvent(event);
```

### Defaults

| Option | Recommended default |
| ------ | ------------------- |
| `bubbles` | `true` |
| `composed` | `true` |
| `cancelable` | `false` |

Cancelable lifecycle hooks opt in explicitly:

```ts
const event = new CustomEvent<DialogBeforeCloseDetail>("dialog:before-close", {
  detail: { reason: "user" },
  bubbles: true,
  composed: true,
  cancelable: true,
});
element.dispatchEvent(event);

if (event.defaultPrevented) {
  return false;
}
```

## Event detail contract

Each package defines explicit detail types:

```ts
interface ToggleChangeDetail {
  previous: boolean;
  current: boolean;
  source: "on" | "off" | "toggle" | "external";
}
```

Guidelines:

- Include only stable public data in `detail`.
- Avoid ambiguous payloads such as `{ value: true }` when semantics matter.
- Do not pass internal controller references unless clearly justified.
- Event detail objects are cloned before dispatch — callers may reuse
  or mutate their original object after dispatch.

Packages are encouraged to expose a normalized `source` union when the
origin matters:

```ts
type ChangeSource = "api" | "keyboard" | "pointer" | "external" | "system";
```

## TypeScript augmentation

Each package declares its event names locally — there is no shared
`PluginEventMap` to augment. Inline the type alongside the dispatch
site:

```ts
type DialogEventMap = {
  "dialog:close": DialogCloseDetail;
  "dialog:before-close": DialogBeforeCloseDetail;
};

const event = new CustomEvent<DialogCloseDetail>("dialog:close", {
  detail: { previous: true, current: false, source: "api" },
  bubbles: true,
  composed: true,
});
```

If a consumer wants to type a listener, they can use
`CustomEvent<DialogCloseDetail>` directly — no global augmentation
required.

## Dispatch targets

| Context | Target |
| ------- | ------ |
| Element-bound directive | Owning element |
| Global store change | `window` (listen with `.window`) |
| Unattached controller factory | Do not emit until Alpine wires a DOM owner |

Examples:

```html
<div @theme:change.window="syncTheme($event.detail)">
```

```html
<div x-dialog @dialog:close="restoreState()">
```

Packages must not create hidden global event buses when native event
propagation is sufficient.

## Documentation requirements

Public package docs must show Alpine listener syntax with `@`:

```html
@menu:activate
@selection:change
```

Document for every event:

1. Listener syntax (`@package:event`, including `.window` when relevant)
2. Dispatch target
3. Bubbling and composition behavior
4. Cancelability
5. Detail type and example payload
6. Exact moment the event fires
7. Whether external state changes can trigger it

## When not to add an event

Skip a new DOM event when:

- A native DOM event already covers the behavior.
- The event would fire for every controller method instead of meaningful
  observable transitions.
- You would need a separate global bus instead of `EventTarget`
  propagation.
- The payload cannot be described with a stable public detail type.

Toolkit events complement Alpine's `$dispatch`. Use `$dispatch` when
you want to fire a one-off custom event from inside an Alpine template;
use `new CustomEvent("package:event", …)` for toolkit-standard
namespaced events from controllers, stores, and directives.

## Testing checklist

- Default bubbling and composition
- Cancelable `before-*` events and `defaultPrevented`
- Typed detail payloads
- Dispatch from elements and `window`
- Supplied detail is not mutated
- SSR-safe module import
- Repeated dispatches are independent
- Alpine listeners receive events via `@package:event` and `.window`

## Related

- [`packages/core/README.md`](../../packages/core/README.md) — API reference
- [`AGENTS.md`](../../AGENTS.md) — monorepo conventions
