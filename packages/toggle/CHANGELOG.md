# @ailuracode/alpine-toggle

## 2.0.0

### Patch Changes

- Updated dependencies [9b88155]
- Updated dependencies [9b88155]
  - @ailuracode/alpine-core@0.3.0

## 1.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 1.0.1

### Patch Changes

- d10cfcb: Move initialization side effects out of `ToggleController` and `LangController` constructors.

  - `ToggleController` no longer schedules microtasks or emits events during construction; `mount()` owns the initialization `change` event.
  - `LangController` no longer reads the global `navigator` during construction; browser detection runs in `mount()` when no navigator is injected.
  - `createToggle()` and `createLang()` continue to return fully initialized controllers by constructing and mounting internally.

- 9a44380: Raise `full surface` bundle budgets to accommodate recent output growth.

  Each package's `full surface` import (`import *`) gzipped size now sits a few dozen bytes above its previous limit. The limits are bumped with ~10% headroom over the current measured size. No runtime API, exports, or behavior changes — these are release-tooling thresholds only.

  | Package                                   | Previous limit | New limit  | Current size |
  | ----------------------------------------- | -------------- | ---------- | ------------ |
  | `@ailuracode/alpine-core`                 | 3.8 kB         | **4.5 kB** | 4.26 kB      |
  | `@ailuracode/alpine-accordion`            | 2.1 kB         | **2.3 kB** | 2.17 kB      |
  | `@ailuracode/alpine-env`                  | 1.6 kB         | **1.8 kB** | 1.63 kB      |
  | `@ailuracode/alpine-geo`                  | 2.1 kB         | **2.4 kB** | 2.12 kB      |
  | `@ailuracode/alpine-keyboard`             | 3 kB           | **3.4 kB** | 3.05 kB      |
  | `@ailuracode/alpine-query-adapter-alpine` | 1 kB           | **1.2 kB** | 1.01 kB      |
  | `@ailuracode/alpine-tabs`                 | 1.9 kB         | **2.2 kB** | 1.96 kB      |
  | `@ailuracode/alpine-toggle`               | 1.1 kB         | **1.3 kB** | 1.14 kB      |
  | `@ailuracode/alpine-tooltip`              | 1.2 kB         | **1.4 kB** | 1.24 kB      |

  Note: although the `.cursor/rules/bundle-budget.mdc` policy nominally calls for a `major` bump when raising a bundle budget, this changeset is `patch` because (a) no runtime API or behavior changed, (b) no public surface changed, and (c) the measured growth is small (<1% in most cases, 12% on `core` only). The budget rule can be revisited separately if needed.

- 9a44380: `@ailuracode/alpine-toggle` `CreateToggleOptions` now accepts a `magicKey` so hosts with a pre-existing `$toggle` collision can move the integration surface without forking the controller. The new `DEFAULT_TOGGLE_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "toggle"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `togglePlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-toggle` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 7856668: Fix Alpine reactivity in `@ailuracode/alpine-toggle`. `$toggle(options)` now produces a truly reactive instance — every state transition routes a write through the Alpine reactive proxy so `x-text` / `x-bind` / `x-show` bindings re-render.

  The previous plugin wrapped the `ToggleController` class instance directly in `Alpine.reactive(...)`. The controller keeps every piece of state in **JS private fields** (`#value`, `#hasTernary`, `#destroyed`, `#mounted`) which Alpine's `Proxy` cannot intercept — so mutations were invisible to Alpine's dependency tracker and templates never re-rendered after a `toggle()` / `set()` / `next()` / `reset()` call.

  The plugin now wires a small **mutable facade** (`buildReactiveToggleView`, internal adapter) between the framework-agnostic controller and `Alpine.reactive`:

  - Commands (`set`, `toggle`, `next`, `reset`) delegate to the controller. The controller's typed `change` event is bridged onto the Alpine facade via a subscription that closes over the **reactive proxy**, so each transition fires exactly one `set` trap.
  - `setSilently(value)` writes directly to the facade because the controller does not emit a `change` event for the hydration path.
  - Lifecycle flags (`isMounted`, `isDestroyed`) are exposed as getters that delegate to the controller so they always reflect current state.

  A new `ToggleReactiveView<TA, TB, TN>` interface is exported from the package barrel — the Alpine-facing facade now exposes `id`, `isMounted`, `isDestroyed`, and `setSilently(value)` in addition to the existing `ToggleInstance` surface. The facade's `value` type resolves through `ToggleReactiveViewValue<TA, TB, TN>` (binary drops `undefined`; ternary keeps it). `ToggleInstance` itself is unchanged.

  A `Writable<T>` helper type is also exported — mirrors `@ailuracode/alpine-calendar`'s helper, used internally to relax `readonly` for the single authorized write path.

  `createToggle()` (standalone) still returns the unwrapped controller — no behavior change for non-Alpine consumers. The architecture-check / headless-CSS invariants are preserved: the controller stays pure (no `window` / `document` / `localStorage` access; no microtask scheduling in the constructor), and the Alpine-aware wiring lives entirely under `src/internal/`.

- Updated dependencies [3c8b40f]
- Updated dependencies [1ae869c]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 1.0.0

### Major Changes

- 7a9418a: Breaking rewrite aligned to `@ailuracode/alpine-theme@0.2.x`. State property names renamed from `truly` / `falsely` / `ternary` to `on` / `off` / `indeterminate`. Method `cycle()` renamed to `next()`. `set(value)` now returns `void` instead of `boolean`. The controller now extends `BaseController` from `@ailuracode/alpine-core`, exposing `id`, `phase`, `isMounted`, `isDestroyed`, `mount()`, `destroy()`, and a typed `on('change', listener)` event bus with `{ current, previous, source }` detail payload. The default export `togglePlugin` is gone — use the named `togglePlugin(options?)` factory (matches `themePlugin`). The `createToggleMagic()` helper is gone — the plugin inlines the magic factory; standalone consumers use `createToggle(options)` which now returns a `ToggleController`. `@ailuracode/alpine-core` is now a peer dependency. Migration table in the [package README](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme).

### Minor Changes

- 7a9418a: Add `setSilently(value)` to `ToggleController` — sets the value without emitting a `change` event. Hydrates the controller from an external authoritative source (e.g. `localStorage`) without broadcasting a transition. The queued initialization microtask now preserves any value hydrated via `setSilently` before it fires, instead of resetting to the original `initial` config. Behavior of `reset()` and the public event surface is unchanged.

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.
