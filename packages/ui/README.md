# `@ailuracode/alpine-ui`

Shared UI primitives for `@ailuracode/alpinejs-toolkit`.

A thin intermediate layer between `@ailuracode/alpine-core` and the feature
packages in this monorepo. Ships generic, framework-agnostic primitives that
multiple feature packages would otherwise re-implement in lock-step:

- **Storage adapters** — generic `localStorage` and in-memory factories
  (value-polymorphic in `Value`).
- **Media query helpers** — SSR-safe `matchMedia` subscription.
- **Portal root** — SSR-safe container factory for teleported content.

This package publishes no Alpine plugin and has no Alpine dependency — it is
purely a set of primitives that feature packages compose.

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