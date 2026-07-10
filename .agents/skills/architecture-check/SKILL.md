---
name: architecture-check
description: "Run, debug, or extend the bun-based architecture:check script that enforces AGENTS.md's monorepo invariants. Use when: running CI architecture checks, adding new invariants, triaging check failures."
---

# Architecture check

The repository MUST include an `architecture:check` script (see
[AGENTS.md](../../../AGENTS.md)). This skill covers how to run it, debug
failures, and extend it.

## When to use

- Investigating a failure in `bun run architecture:check` on CI.
- Adding a new invariant that AGENTS.md now requires.
- Bootstrapping the script for a brand-new monorepo.

## Current invariants

The script MUST automatically validate, at minimum:

- Every package depends on core.
- No circular dependencies exist.
- Core does not depend on features.
- Package names match their folders.
- `sideEffects` is configured.
- Required exports exist.
- Required files exist.
- Peer dependencies are correct.
- No internal imports cross package boundaries.
- No extensive implementations live in `index.ts`.
- Every stateful package exports a controller.
- New packages are registered in the source of truth.

## Run it

```bash
bun run architecture:check
```

The script MUST exit non-zero on any violation so CI can gate merges.

## Adding a new invariant

1. Express the rule in normative language in [AGENTS.md](../../../AGENTS.md)
   (`MUST` / `MUST NOT` / `SHOULD` / `MAY`).
2. Add the machine-checkable equivalent to
   `scripts/architecture-check.ts` (or whatever the project uses).
3. Reference the AGENTS.md section in a comment so reviewers can trace the
   rule.
4. Add a failing fixture first; confirm the script fails; then fix the
   fixture and confirm the script passes.
5. Document the new invariant in this skill under _Current invariants_.

## Debugging a failure

- Read the failing invariant name — it maps 1:1 to an AGENTS.md section.
- Fix the package, do NOT loosen the check.
- If the rule is wrong, update AGENTS.md first, then the script. Never edit
  one in isolation.

## Anti-patterns to refuse

- Lowering a check to make a contribution pass.
- Skipping the script locally.
- Adding a check that is not traceable to a rule in AGENTS.md.
