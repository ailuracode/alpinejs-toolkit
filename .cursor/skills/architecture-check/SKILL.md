---
name: architecture-check
description: "Design and extend monorepo architecture invariants from AGENTS.md and .cursor/rules. Use when: defining new invariants, reviewing structural drift, or extending the automated architecture:check script."
---

# Architecture check

This repo documents architecture invariants in
[AGENTS.md](../../../AGENTS.md) and [`.cursor/rules/architecture.mdc`](../../rules/architecture.mdc).
`pnpm run architecture:check` enforces them via
[`scripts/architecture-check.mjs`](../../../scripts/architecture-check.mjs).

## When to use

- Reviewing whether a new package follows monorepo invariants.
- Adding a new invariant that AGENTS.md now requires.
- Extending `scripts/architecture-check.mjs` or
  `scripts/architecture-check-policy.mjs` for CI.

## Automated checks

| Check | Rule source |
|-------|-------------|
| No `internal/` barrel re-exports (with documented exceptions) | `architecture.mdc` imports |
| No cross-package `internal/` imports | `architecture.mdc` imports |
| No runtime `alpinejs` imports in controller modules | `architecture.mdc` invariant 5 |
| No constructor browser globals / timers | `new-package.mdc` headless controllers |
| Stateful packages expose `*Controller` or `./controller` subpath | `new-package.mdc` controllers |
| Controller tests import implementation modules | `testing.mdc` layer split |
| Acyclic deps; core independent of feature packages | `architecture.mdc` invariant 10 |
| Headless CSS policy (shared with `repo:check`) | `new-package.mdc` CSS policy |

Documented exceptions live in
[`scripts/architecture-check-policy.mjs`](../../../scripts/architecture-check-policy.mjs).

## Manual check workflow

```bash
pnpm run architecture:check
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run pack:check
pnpm run repo:check
```

Cross-check the diff against `architecture.mdc`, `testing.mdc`, and `new-package.mdc`.

## Adding a new invariant

1. Express the rule in normative language in [AGENTS.md](../../../AGENTS.md)
   (`MUST` / `MUST NOT` / `SHOULD` / `MAY`).
2. Mirror it in `.cursor/rules/architecture.mdc` (or a scoped rule).
3. Add the check to `scripts/architecture-check.mjs` and, when needed, a narrow
   exception to `scripts/architecture-check-policy.mjs`.
4. Add a regression fixture to `test/architecture-check.test.ts`.
5. Document the invariant in this skill under _Automated checks_.

`repo:check` remains responsible for package metadata (`sideEffects`, bundle
budgets, demo wiring, documented package counts). `architecture:check` focuses
on source-level structure and test policy.

## Anti-patterns to refuse

- Lowering a check to make a contribution pass.
- Skipping invariant review locally.
- Adding a check that is not traceable to a rule in AGENTS.md or `.cursor/rules/`.
- Disabling a rule globally instead of adding a documented, narrow exception.
