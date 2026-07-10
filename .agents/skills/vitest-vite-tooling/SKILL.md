---
name: vitest-vite-tooling
description: Vitest + Vite setup, migration, and per-package configuration for the @ailuracode/alpinejs-toolkit monorepo. Use when adding Vitest/Vite to a package, fixing test runner or dev-server issues, or extending the workspace config.
---

# Vitest + Vite tooling

How this monorepo runs Vitest and Vite. Always-on rules live in
[`../instructions/tooling.instructions.md`](../../instructions/tooling.instructions.md);
this skill gives the workflow, examples, and recovery recipes.

## When to use

- Adding Vitest to a new package.
- Migrating an existing package from `node:test` to Vitest.
- Adding a per-package Vite demo/storybook.
- Debugging "module not found", "no tests found", or environment issues.
- Picking the right environment (`node` vs `jsdom`) for a new spec.

## Workspace topology

```text
/
├── vitest.workspace.ts        # enumerates package configs
├── vitest.config.ts           # root config (coverage defaults)
├── vite.config.ts             # workspace config (fmt/lint blocks + host)
└── packages/
    └── <name>/
        ├── vitest.config.ts   # per-package overrides (mandatory)
        └── vite.config.ts     # per-package demo config (opt-in, only with demo content)
```

The workspace file is the single source of truth for "which packages run
tests via Vitest". Adding a package requires dropping a `vitest.config.ts`
into `packages/<name>/` — no registry edits elsewhere.

Per-package `vite.config.ts` is **opt-in** — see
`../instructions/tooling.instructions.md` for the rule. For the toolkit's
current packages (headless controllers), there are no per-package demos,
so there are no per-package `vite.config.ts` files.

## Choosing the environment

| Package type                             | Environment | Why                                                 |
| ---------------------------------------- | ----------- | --------------------------------------------------- |
| Pure logic (e.g. utility, math, parsers) | `node`      | fastest, no jsdom startup                           |
| DOM helpers, controllers, magics         | `jsdom`     | needs `window`, `matchMedia`, etc.                  |
| Hybrid (some pure, some DOM)             | `jsdom`     | jsdom is acceptable for both; the perf hit is small |

`environment` MUST be set in the per-package `vitest.config.ts`. The
root config only provides the default (`node`) for safety.

## Writing specs

- File naming: `*.spec.ts` (preferred) or `*.test.ts` (legacy).
- Imports: use `vitest` for `describe`, `it`, `expect`, `vi`,
  `beforeAll`, `afterAll`, `beforeEach`, `afterEach`.
- Assertions: prefer `expect(x).toBe(y)`. `node:assert/strict` continues
  to work and is acceptable for legacy specs.
- Stubs: prefer `vi.spyOn` and `vi.fn`. If you need a real DOM stub
  (matchMedia, IntersectionObserver, ResizeObserver), add it to
  `test/setup.ts` and reference it via `setupFiles`.
- Snapshots: use `expect(x).toMatchSnapshot()` only for stable, public
  outputs. Never for events with timestamps or random IDs.

## Migrating a package from `node:test`

1. Install Vitest + jsdom in the package devDeps:
   `bun add -d vitest @vitest/coverage-v8 jsdom`.
2. Add `vitest.config.ts` with `environment: 'jsdom'` if the package
   touches DOM APIs.
3. Rename `*.test.ts` → `*.spec.ts` (legacy `*.test.ts` is still
   allowed).
4. Replace `from 'node:test'` with `from 'vitest'`.
5. Replace `before(...)` and `after(...)` with `beforeAll(...)` and
   `afterAll(...)` (Vitest does not export unprefixed variants).
6. Update the test scripts in `package.json`:
   `vitest run`, `vitest`, `vitest --ui`, `vitest run --coverage`.
7. Run `bun test` from the package root. Iterate until green.
8. Run `bun run typecheck && bun run lint && bun run build` from the
   workspace root.

## Coverage

- Coverage config lives in the **root** `vitest.config.ts`.
- Each package sets only `include` for its own source files (if it
  needs to override the root default).
- Always run coverage locally with `bun run test:coverage` from the
  package directory before opening a PR.

## Common pitfalls

| Symptom                                                | Cause                                                     | Fix                                                               |
| ------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `No test files found`                                  | `vitest run` from package root with no `vitest.config.ts` | Add `vitest.config.ts`                                            |
| `TypeError: before is not a function`                  | Imported `before`/`after` from `node:test`                | Use `beforeAll`/`afterAll` from `vitest`                          |
| `expected false to be true` from matchMedia tests      | jsdom matchMedia wins over `test/setup.ts` stub           | Make `setup.ts` always redefine `globalThis.matchMedia`           |
| `Cannot find package 'jsdom'`                          | Forgot `bun add -d jsdom`                                 | Install in package devDeps                                        |
| `Build failed: Unexpected token` in `vitest.config.ts` | JSDoc comment contains `{...}`                            | Rephrase the comment to avoid curly braces                        |
| `coverage/` files flagged by lint                      | Coverage artifacts included in vite+ lint scan            | Add `**/coverage/**` to `lint.ignorePatterns` in `vite.config.ts` |

## Closing checklist

Before opening a PR that touches tooling:

```bash
bun run typecheck
bun run lint
bun test
bun run test:coverage
bun run build
bun --filter '@ailuracode/<name>' test
bun --filter '@ailuracode/<name>' test:coverage
bun --filter '@ailuracode/<name>' build
```
