---
"@ailuracode/alpine-toggle": minor
---

Add two new capability tier entrypoints to `@ailuracode/alpine-toggle` for consumer-controlled bundle size.

## New entrypoints

- **`@ailuracode/alpine-toggle/puppy`** — minimal binary toggle. `{ value, set, toggle }` only. No events, ids, lifecycle, hydration, or ternary state.
- **`@ailuracode/alpine-toggle/doggo`** — balanced controller for reusable application state. Adds configurable states (binary or ternary), `is`, `next`, `reset`, and a lightweight `onChange(listener)` subscription.

The root package (`@ailuracode/alpine-toggle`) is unchanged and remains **Big Dog** — the complete controller with the typed event bus, generated ids, `mount()` / `destroy()` lifecycle, and `setSilently` hydration.

## Compatibility

All three tiers satisfy the same `{ readonly value: T, set(value: T): void, toggle(): T }` contract. Code written against the common surface continues to work unchanged when switching between Puppy, Doggo, and Big Dog — only the import path changes.

```diff
- import togglePlugin from "@ailuracode/alpine-toggle";
+ import togglePlugin from "@ailuracode/alpine-toggle/puppy";
```

## Reactive facade invariant

Every tier wraps a **mutable facade** in `Alpine.reactive(facade)`. Commands route through the proxy, listeners re-render templates, and the controller instance is never exposed directly to Alpine (the failure mode that PR #154 fixed for Big Dog is now structurally prevented across all three tiers via a shared `createReactiveView()` factory in `internal/reactive-adapter.ts`).

## Bundle budget (gzip, actual measurement)

| Tier | Surface | Gzip | Brotli |
|---|---|---:|---:|
| Puppy | `{value, set, toggle}` only | ~345 B | ~311 B |
| Doggo | + custom states, `is`, `next`, `reset`, `onChange` | ~700 B | ~643 B |
| Big Dog | + ids, lifecycle, typed events, `setSilently` | ~1.08 kB | ~960 B |

## Architecture constraints honored

- No `class Puppy extends Doggo` or runtime feature flags — each tier has its own controller.
- Tier implementations live under `src/variants/{puppy,doggo}/` and must not import from `src/controller.ts`, `src/events.ts`, `src/plugin.ts`, or other tier directories — enforced by `scripts/architecture-check.mjs`.
- Pure helpers in `src/internal/{transitions,validation}.ts` are shared across tiers and remain private (not exposed via `exports`).

See `sdd/toggle-tiers/{exploration,proposal,specs,design,tasks}.md` for the full PoC record.
