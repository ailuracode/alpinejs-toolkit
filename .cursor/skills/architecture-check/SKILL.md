---
name: architecture-check
description: "Design and extend monorepo architecture invariants from AGENTS.md and .cursor/rules. Use when: defining new invariants, reviewing structural drift, or planning an automated architecture:check script."
---

# Architecture check

This repo documents architecture invariants in
[AGENTS.md](../../../AGENTS.md) and [`.cursor/rules/architecture.mdc`](../../rules/architecture.mdc).
There is **no** `architecture:check` script in `package.json` yet — use this
skill to enforce rules manually or to bootstrap automation.

## When to use

- Reviewing whether a new package follows monorepo invariants.
- Adding a new invariant that AGENTS.md now requires.
- Planning `scripts/architecture-check.mjs` (or similar) for CI.

## Current invariants

Manually verify, at minimum:

- Every feature package depends on `@ailuracode/alpine-core`.
- No circular dependencies between packages.
- Core does not depend on feature packages.
- Package names match their folders (`@ailuracode/alpine-<name>`).
- `sideEffects: false` is set on publishable packages.
- Required exports exist in `src/index.ts`.
- Peer dependencies are correct and not bundled.
- No internal imports cross package boundaries.
- `index.ts` is re-exports only — no heavy implementations.
- Stateful packages expose a public controller class.
- Headless packages do not ship styled UI (`scripts/headless-css-policy.mjs`; devtools exempt path documented in AGENTS.md).

## Manual check workflow

```bash
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run pack:check
pnpm run repo:check
```

Cross-check the diff against `architecture.mdc` and `new-package.mdc`.

## Adding a new invariant

1. Express the rule in normative language in [AGENTS.md](../../../AGENTS.md)
   (`MUST` / `MUST NOT` / `SHOULD` / `MAY`).
2. Mirror it in `.cursor/rules/architecture.mdc` (or a scoped rule).
3. When automating, add the check to `scripts/architecture-check.mjs` and wire
   `pnpm run architecture:check` in root `package.json`.
4. Document the invariant in this skill under _Current invariants_.

`repo:check` already enforces the headless CSS boundary via
`scripts/headless-css-policy.mjs` (development-tooling path exceptions).

## Anti-patterns to refuse

- Lowering a check to make a contribution pass.
- Skipping invariant review locally.
- Adding a check that is not traceable to a rule in AGENTS.md or `.cursor/rules/`.
