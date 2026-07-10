---
name: vitest-vite-tooling
description: Vitest + Vite setup, migration, and per-package configuration for the @ailuracode/alpinejs-toolkit monorepo. Use when adding Vitest/Vite to a package, fixing test runner or dev-server issues, or extending the workspace config.
---

# Vitest + Vite tooling

How this monorepo runs Vitest. Always-on rules live in
[`.cursor/rules/tooling-configs.mdc`](../../rules/tooling-configs.mdc);
this skill gives the workflow, examples, and recovery recipes.

## When to use

- Adding Vitest to a new package.
- Migrating an existing package from `node:test` to Vitest.
- Debugging "module not found", "no tests found", or environment issues.
- Picking the right environment (`node` vs `happy-dom`) for a new spec.

## Workspace topology

```text
/
├── vitest.config.ts           # root config (happy-dom, coverage, includes)
├── test/setup.ts              # shared setup (matchMedia, cleanup)
├── test/helpers.ts            # startAlpine() and shared harnesses
└── packages/
    └── <name>/
        ├── test/**/*.spec.ts  # preferred naming
        └── vitest.config.ts   # optional local overrides only
```

The root `vitest.config.ts` discovers tests in `packages/*/test/**/*.{test,spec}.ts`.
Most packages do **not** need a local `vitest.config.ts`; only add one when a
package requires overrides (theme, scroll, media, sidebar, ui today).

## Choosing the environment

| Package type                             | Environment | Why                                      |
| ---------------------------------------- | ----------- | ---------------------------------------- |
| Pure logic (parsers, query cache)        | `node`      | fastest, no DOM startup                  |
| DOM helpers, controllers, magics         | `happy-dom` | root default; needs `window`, `matchMedia` |
| Hybrid (some pure, some DOM)             | `happy-dom` | acceptable for both in this monorepo     |

Root default is `happy-dom` in `vitest.config.ts`.

## Writing specs

- File naming: `*.spec.ts` (preferred) or `*.test.ts` (legacy).
- Imports: use `vitest` for `describe`, `it`, `expect`, `vi`, hooks.
- Stubs: prefer `vi.spyOn` and `vi.fn`. For `matchMedia`, use `setMatchMedia()` from `test/setup.ts`.
- Store plugins: `startAlpine()` from `test/helpers.ts`.
- Magic plugins: `createMagicHarness()` from `test/mock-alpine.ts`.

## Migrating a package from `node:test`

1. Add devDeps: `pnpm add -D vitest @vitest/coverage-v8 happy-dom` in the package.
2. Add `vitest.config.ts` only if the package needs local overrides.
3. Replace `from 'node:test'` with `from 'vitest'`.
4. Replace `before`/`after` with `beforeAll`/`afterAll`.
5. Update `package.json` scripts: `"test": "vitest run"`.
6. Run `pnpm test` from the package root, then from workspace root.

## Coverage

- Coverage thresholds live in the **root** `vitest.config.ts`.
- Run `pnpm run test:coverage` from the workspace root before opening a PR.

## Common pitfalls

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `No test files found` | Running from package without matching include | Run from root or add local `vitest.config.ts` |
| `TypeError: before is not a function` | `node:test` hooks | Use `beforeAll`/`afterAll` from `vitest` |
| matchMedia tests fail | Missing stub | Call `setMatchMedia()` from `test/setup.ts` |
| Store plugin tested with magic harness | Wrong harness | Use `startAlpine()` |

## Closing checklist

```bash
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run test:coverage
pnpm run build
pnpm run pack:check
```
