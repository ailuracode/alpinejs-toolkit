# Plugin DOM events

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

`@ailuracode/alpine-core` ships `dispatchPluginEvent()` so every package
uses the same naming rules, `CustomEvent.detail` contract, defaults, and
TypeScript augmentation strategy.

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

## Dispatch helper

```ts
import { dispatchPluginEvent } from '@ailuracode/alpine-core';

const event = dispatchPluginEvent(element, 'toggle', 'change', {
  previous: false,
  current: true,
  source: 'toggle',
});
```

### Defaults

| Option | Default |
| ------ | ------- |
| `bubbles` | `true` |
| `composed` | `true` |
| `cancelable` | `false` |

Cancelable lifecycle hooks opt in explicitly:

```ts
const event = dispatchPluginEvent(element, 'dialog', 'before-close', detail, {
  cancelable: true,
});

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
  source: 'on' | 'off' | 'toggle' | 'external';
}
```

Guidelines:

- Include only stable public data in `detail`.
- Avoid ambiguous payloads such as `{ value: true }` when semantics matter.
- Do not pass internal controller references unless clearly justified.
- Event detail objects are cloned before dispatch — callers may reuse or
  mutate their original object after dispatch.

Optional normalized sources:

```ts
type ChangeSource = 'api' | 'keyboard' | 'pointer' | 'external' | 'system';
```

Packages may expose narrower `source` unions when semantics differ.

## TypeScript augmentation

Augment the shared map from feature packages:

```ts
declare module '@ailuracode/alpine-core' {
  interface PluginEventMap {
    'toggle:change': ToggleChangeDetail;
    'dialog:before-close': DialogBeforeCloseDetail;
  }
}
```

Helpers exported from core:

- `PluginEventName<TNamespace, TEvent>` — `` `${namespace}:${event}` ``
- `PluginCustomEvent<TName>` — `CustomEvent<PluginEventMap[TName]>`

Do not add fragile global DOM overloads unless they provide clear value and
remain compatible with TypeScript library updates.

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
- You would need a separate global bus instead of `EventTarget` propagation.
- The payload cannot be described with a stable public detail type.

`dispatchPluginEvent()` does not replace Alpine's `$dispatch`. Use it for
toolkit-standard namespaced events from controllers, stores, and
directives.

## Testing checklist

- Default bubbling and composition
- Cancelable `before-*` events and `defaultPrevented`
- Typed detail payloads
- Dispatch from elements and `window`
- Supplied detail is not mutated
- Invalid namespace or event segments throw `TOOLKIT_INVALID_ARGUMENT`
- SSR-safe module import
- Repeated dispatches are independent
- Alpine listeners receive events via `@package:event` and `.window`

## Related

- [`packages/core/README.md`](../packages/core/README.md) — API reference
- [`AGENTS.md`](../AGENTS.md) — monorepo conventions
