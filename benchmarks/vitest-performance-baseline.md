# Vitest performance baseline

Baseline for [ALP-128](https://linear.app/ailuracode/issue/ALP-128/establish-a-reproducible-vitest-performance-baseline) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).

## How to reproduce

```bash
pnpm run test:benchmark
```

Options:

- `--runs <n>` — repetitions per cold/warm group (default: 3)
- `--quick` — workspace scenarios only (skip package runs)
- `--skip-workspace` — reuse workspace measurements from an existing baseline JSON
- `--output <dir>` — output directory (default: `benchmarks/`)

## Environment

- Captured: 2026-07-14T20:32:50.031Z
- Node: v24.15.0
- Platform: linux 6.18.33.2-microsoft-standard-WSL2
- CPUs: 12
- Vitest: 4.1.10
- Default pool: forks (Vitest default)

## Inventory

- Test files: 226
- Listed tests: 2293

## Workspace commands

| Command | Mode | Median wall | Median RSS | Transform | Setup | Import | Tests | Environment |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `pnpm test` | cold | 68990ms | 464316KB | 17.79s | 21.99s | 43.24s | 71.97s | 166.9s |
| `pnpm test` | warm | 57510ms | 472760KB | 17.37s | 20.93s | 43.03s | 82.57s | 168.56s |
| `pnpm run test:coverage` | cold | 74950ms | 617712KB | 17.67s | 22.91s | 45.12s | 85.6s | 169.45s |
| `pnpm run test:coverage` | warm | 62370ms | 589940KB | 17.78s | 22.55s | 45.38s | 96.11s | 170s |

## Package-level commands

| Package | Category | Mode | Median wall | Files summary | Note |
| --- | --- | --- | ---: | --- | --- |
| @ailuracode/alpine-core | pure-controller | cold | 2850ms | 13 passed (13) | Scoped to packages/core (correct). |
| @ailuracode/alpine-core | pure-controller | warm | 3140ms | 13 passed (13) | Scoped to packages/core (correct). |
| @ailuracode/alpine-dialog | dom-heavy | cold | 68990ms | 1 failed / 225 passed (226) | Package script passes `test` as a path filter — currently matches the full workspace suite. (inherits workspace test) |
| @ailuracode/alpine-dialog | dom-heavy | warm | 57510ms | 1 failed / 225 passed (226) | Package script passes `test` as a path filter — currently matches the full workspace suite. (inherits workspace test) |
| @ailuracode/alpine-query | async-cache | cold | 68990ms | 1 failed / 225 passed (226) | Package script passes `test` as a path filter — currently matches the full workspace suite. (inherits workspace test) |
| @ailuracode/alpine-query | async-cache | warm | 57510ms | 1 failed / 225 passed (226) | Package script passes `test` as a path filter — currently matches the full workspace suite. (inherits workspace test) |
| @ailuracode/alpine-dialog (intended scope) | dom-heavy | cold | 1650ms | 4 passed (4) | Reference run for the intended package-only scope. |
| @ailuracode/alpine-dialog (intended scope) | dom-heavy | warm | 1660ms | 4 passed (4) | Reference run for the intended package-only scope. |

## Ranked optimization targets

1. **workspace environment** — 168.56s median warm (largest phase). Global happy-dom environment and setup apply to every file; environment dominates non-coverage runs.
2. **workspace tests** — 82.57s median warm. Global happy-dom environment and setup apply to every file; tests dominates non-coverage runs.
3. **workspace import** — 43.03s median warm. Global happy-dom environment and setup apply to every file; import dominates non-coverage runs.
4. **@ailuracode/alpine-dialog package script** — 57510ms median warm. Package script passes `test` as a path filter — currently matches the full workspace suite.
5. **@ailuracode/alpine-query package script** — 57510ms median warm. Package script passes `test` as a path filter — currently matches the full workspace suite.
6. **package:repository** — 53383.907ms aggregated file time. 10 files / 70 tests in warm workspace run.
7. **package:query-kit** — 9399ms aggregated file time. 16 files / 135 tests in warm workspace run.
8. **package:ui** — 7335.043ms aggregated file time. 3 files / 32 tests in warm workspace run.
9. **package:gesture** — 1290.762ms aggregated file time. 7 files / 75 tests in warm workspace run.
10. **package:query** — 1062.867ms aggregated file time. 11 files / 156 tests in warm workspace run.
11. **test/pack-check.test.ts** — 47834.656ms file duration. Slowest individual test file in warm workspace run.
12. **packages/ui/test/contract.spec.ts** — 7213.289ms file duration. Slowest individual test file in warm workspace run.
13. **packages/query-kit/test/devtools.test.ts** — 4800.895ms file duration. Slowest individual test file in warm workspace run.
14. **test/architecture-check.test.ts** — 4441.256ms file duration. Slowest individual test file in warm workspace run.
15. **packages/query-kit/test/panel-preferences.test.ts** — 3596.492ms file duration. Slowest individual test file in warm workspace run.

## CI reference

Representative GitHub Actions timings from workflow runs on ubuntu-latest (Node 22).

- Full coverage (run `29303074025`): **1.15 min**
- Affected tests (run `29362602048`): **1.03 min**

Update `benchmarks/vitest-baseline.json` after refreshing local baselines. Compare future runs with:

```bash
node scripts/vitest-benchmark.mjs --runs 3
```

