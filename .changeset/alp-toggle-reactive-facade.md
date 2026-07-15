---
"@ailuracode/alpine-toggle": patch
---

Fix Alpine reactivity in `@ailuracode/alpine-toggle`. `$toggle(options)` now produces a truly reactive instance — every state transition routes a write through the Alpine reactive proxy so `x-text` / `x-bind` / `x-show` bindings re-render.

The previous plugin wrapped the `ToggleController` class instance directly in `Alpine.reactive(...)`. The controller keeps every piece of state in **JS private fields** (`#value`, `#hasTernary`, `#destroyed`, `#mounted`) which Alpine's `Proxy` cannot intercept — so mutations were invisible to Alpine's dependency tracker and templates never re-rendered after a `toggle()` / `set()` / `next()` / `reset()` call.

The plugin now wires a small **mutable facade** (`buildReactiveToggleView`, internal adapter) between the framework-agnostic controller and `Alpine.reactive`:

- Commands (`set`, `toggle`, `next`, `reset`) delegate to the controller. The controller's typed `change` event is bridged onto the Alpine facade via a subscription that closes over the **reactive proxy**, so each transition fires exactly one `set` trap.
- `setSilently(value)` writes directly to the facade because the controller does not emit a `change` event for the hydration path.
- Lifecycle flags (`isMounted`, `isDestroyed`) are exposed as getters that delegate to the controller so they always reflect current state.

A new `ToggleReactiveView<TA, TB, TN>` interface is exported from the package barrel — the Alpine-facing facade now exposes `id`, `isMounted`, `isDestroyed`, and `setSilently(value)` in addition to the existing `ToggleInstance` surface. The facade's `value` type resolves through `ToggleReactiveViewValue<TA, TB, TN>` (binary drops `undefined`; ternary keeps it). `ToggleInstance` itself is unchanged.

A `Writable<T>` helper type is also exported — mirrors `@ailuracode/alpine-calendar`'s helper, used internally to relax `readonly` for the single authorized write path.

`createToggle()` (standalone) still returns the unwrapped controller — no behavior change for non-Alpine consumers. The architecture-check / headless-CSS invariants are preserved: the controller stays pure (no `window` / `document` / `localStorage` access; no microtask scheduling in the constructor), and the Alpine-aware wiring lives entirely under `src/internal/`.