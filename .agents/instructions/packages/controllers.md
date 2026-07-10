---
applyTo: 'packages/**/controller.ts'
description: 'Controller, state, lifecycle, events, and OOP rules for @ailuracode/alpinejs-toolkit. Load when editing or creating a controller file under packages/.'
---

# Controllers

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded whenever
the agent touches `packages/**/controller.ts`.

## Object orientation

Every package with state, events, or a lifecycle MUST expose a public
controller class.

Convention:

```text
<Feature>Controller
<Feature>Plugin
<Feature>Options
<Feature>State
<Feature>Events
<Feature>Error
```

```typescript
export class DialogController extends BaseController<DialogEvents> {
    // ...
}
```

The controller is responsible for private state, state transitions, operation
validation, internal events, lifecycle, cleanup, and coordination with
external adapters. Pure algorithms SHOULD remain plain functions. Classes MUST
NOT wrap a single function without adding state, invariants, lifecycle,
polymorphism, or encapsulation. Composition MUST be preferred over
inheritance; deep class hierarchies are not allowed.

## State

Mutable state MUST be private. Prefer JavaScript private fields:

```typescript
class TabsController {
    #activeValue: string | null = null;
}
```

Public state MUST be exposed through getters, readonly snapshots, or query
methods. Mutations MUST be performed via semantic commands — `open()`,
`close()`, `select(value)`, `activate(index)`, `next()`, `previous()`,
`reset()`. A generic API such as `setState()`, `patchState()`, or direct field
assignment MUST NOT be exposed. Derived booleans MUST be getters, not
methods: `controller.isOpen`, never `controller.isOpen()`.

## Headless controllers

Controllers MUST NOT import Alpine. They SHOULD avoid depending on the DOM
when the logic can remain independent. When the DOM is essential, it MUST be
received through `mount(root)`, `connect(element)`, adapters, or explicit
methods.

The constructor MUST NOT register global listeners, access `window`,
`document`, `localStorage`, start timers, initialize external libraries, or
mutate the DOM. It MUST only validate options, normalize configuration, and
create internal state. Side effects MUST start in `mount()`, `start()`, or
`connect()`.

## Lifecycle

Every controller with effects MUST implement `mount(): void` and
`destroy(): void`. When needed it MAY also implement `start()`, `stop()`,
`connect(element)`, and `disconnect()`. `mount()` and `destroy()` MUST be
idempotent.

`destroy()` MUST clean up: event listeners, timers, observers, subscriptions,
focus traps, Embla instances, Floating UI auto-update, abort controllers,
registries, and DOM references. Listeners MUST be registered through
mechanisms that allow removal — prefer `AbortController`, `CleanupStack`,
Alpine's `cleanup` callback, or `Alpine.data`'s `destroy()` method.
Anonymous global listeners that cannot be removed are not allowed.

## Events

Controllers MUST use strongly-typed internal events:

```typescript
interface ComboboxEvents {
    change: ComboboxChangeDetail;
    open: ComboboxOpenDetail;
    close: ComboboxCloseDetail;
}
```

The controller event API MUST be consistent:

```typescript
controller.on('change', listener);
controller.once('close', listener);
controller.off('change', listener);
```

Events MUST be emitted after the state transition is confirmed. Event details
MUST be typed and stable; when applicable use:

```typescript
interface ChangeDetail<T> {
    value: T;
    previousValue: T;
    reason: string;
    originalEvent?: Event;
}
```

A change to the public shape of `event.detail` is a breaking change.
