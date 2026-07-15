---
"@ailuracode/alpine-toggle": patch
---

Fix Alpine reactivity in `@ailuracode/alpine-toggle`. `$toggle(options)` now produces a truly reactive instance — every state transition routes a write through the Alpine reactive proxy so `x-text` / `x-bind` / `x-show` bindings re-render.

The previous plugin wrapped the `ToggleController` class instance directly in `Alpine.reactive(...)`. The controller keeps every piece of state in **JS private fields** (`#value`, `#hasTernary`, `#destroyed`, `#mounted`) which Alpine's `Proxy` cannot intercept — so mutations were invisible to Alpine's dependency tracker and templates never re-rendered after a `toggle()` / `set()` / `next()` / `reset()` call.

The plugin now wires a small **mutable facade** (`buildReactiveToggleView`, internal adapter) between the framework-agnostic controller and `Alpine.reactive`:

- Commands (`set`, `toggle`, `next`, `reset`, `setSilently`) delegate to the controller, then write the new value through `this.value = …` so the assignment passes through the reactive proxy's `set` trap.
- The plugin subscribes to the controller's typed `change` event, closing over the **reactive proxy** (not the raw facade) so external mutations still route back through Alpine.
- A new `ToggleReactiveView<TA, TB, TN>` interface is exported from the package barrel — the Alpine-facing facade now exposes `id`, `isMounted`, `isDestroyed`, and `setSilently(value)` in addition to the existing `ToggleInstance` surface. `ToggleInstance` itself is unchanged.

`createToggle()` (standalone) still returns the unwrapped controller — no behavior change for non-Alpine consumers. The architecture-check / headless-CSS invariants are preserved: the controller stays pure (no `window` / `document` / `localStorage` access; no microtask scheduling in the constructor), and the Alpine-aware wiring lives entirely under `src/internal/`.