# `@ailuracode/alpine-ui`

Shared framework-agnostic UI primitives for `@ailuracode/alpinejs-toolkit`.

## Architectural role

`alpine-ui` is the **infrastructure layer** — SSR-safe DOM primitives and
generic algorithms that multiple feature packages would otherwise re-implement
in lock-step.

It lives below every feature package (`dialog`, `menu`, `theme`, `overlay`, …)
and has **no imports from higher-level toolkit packages**. It ships no Alpine
plugin and has no hard Alpine dependency.

### What belongs here

- SSR-safe browser API wrappers (`safeDocument`, `safeMatchMedia`)
- Generic storage adapters (`localStorage`, in-memory)
- DOM primitives (portal root creation)
- Media query subscription helpers

### What does NOT belong here

- **Controller logic** — state machines, open/close/toggle, keyboard navigation
  belong in the owning feature package.
- **Alpine directives or magics** — those go in the feature plugin package.
- **CSS or markup** — headless means zero visual output.
- **Accessibility helpers** — ARIA attribute generators live with the
  controller that produces them.

## Contribution checklist

Before adding code to `alpine-ui`, verify:

1. **Framework-agnostic** — no Alpine, no `@ailuracode/alpine-core` dependency
   (only browser / Node built-ins).
2. **Reused or reusable** — the helper already has ≥2 real consumers OR the
   maintainers agree it is a foundational primitive for planned reuse.
3. **Ownership is clear** — the code implements a generic DOM or algorithm
   concern, not a feature-specific policy.
4. **Granular exports** — prefer a separate subpath file over growing a
   monolithic barrel export. Every import path must be tree-shakeable.
5. **Tests** — the helper has its own test file under `test/`.
6. **No leakage up** — `alpine-ui` must never import a higher-level package
   (anything outside the `core`/`ui` layer).

### Examples

| Code | Belongs in `ui`? | Reason |
|------|------------------|--------|
| `createPortalRoot()` | ✅ Yes | SSR-safe DOM primitive, consumed by overlay |
| `createLocalStorageAdapter()` | ✅ Yes | Generic storage, foundation for feature adapters |
| `createMemoryAdapter()` | ✅ Yes | Same — storage abstraction |
| `createMediaQueryListener()` | ✅ Yes | Reactive media query, planned cross-package reuse |
| Dialog controller (`open`/`close`/focus) | ❌ No | Feature-specific state machine |
| `x-data` directive | ❌ No | Alpine-specific |

## Exports

Current public surface (granular, tree-shakeable):

- **`createPortalRoot(options?)`** — SSR-safe portal container factory. Used by
  `@ailuracode/alpine-overlay`.
- **`createLocalStorageAdapter<Value>(options)`** — Generic `localStorage`
  adapter, value-polymorphic in `Value`.
- **`createMemoryAdapter<Value>(options?)`** — In-memory storage for tests or
  ephemeral state.
- **`createMediaQueryListener(query, listener)`** — SSR-safe `matchMedia`
  subscription.

Types:
- `PortalRootOptions`, `StorageAdapter`, `SubscribableStorageAdapter`,
  `LocalStorageAdapterOptions`, `MemoryAdapterOptions`, `Unsubscribe`

## Install

```bash
pnpm add @ailuracode/alpine-ui
```

## Usage

```ts
import {
  createLocalStorageAdapter,
  createMemoryAdapter,
  createMediaQueryListener,
  createPortalRoot,
} from "@ailuracode/alpine-ui";

// Persisted boolean preference
const themePref = createLocalStorageAdapter<"light" | "dark">({
  key: "theme-pref",
  parse: (raw) => (raw === "light" || raw === "dark" ? raw : null),
  serialize: (value) => value,
});

// In-memory cell for tests
const cell = createMemoryAdapter<number>({ initial: 0 });

// matchMedia subscription (SSR-safe)
const stop = createMediaQueryListener("(min-width: 1024px)", (event) => {
  console.log(event.matches);
});

// Portal root (idempotent)
const portal = createPortalRoot(); // <div id="overlay-root">…</div>
```

## License

MIT © [ailuracode](https://github.com/ailuracode)
