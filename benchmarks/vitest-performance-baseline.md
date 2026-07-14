# Vitest performance baseline

Benchmark for [ALP-128](https://linear.app/ailuracode/issue/ALP-128/establish-a-reproducible-vitest-performance-baseline) with tuning from [ALP-134](https://linear.app/ailuracode/issue/ALP-134/benchmark-and-tune-vitest-execution-settings) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).

## How to reproduce

```bash
pnpm run test:benchmark
```

Options:

- `--runs <n>` — repetitions per cold/warm group (default: 3)
- `--quick` — workspace scenarios only (skip package runs)
- `--skip-workspace` — reuse workspace measurements from an existing baseline JSON
- `--output <dir>` — output directory (default: `benchmarks/`)

Tuning evidence: `benchmarks/vitest-tuning-decisions.md`. Regression check: `pnpm run test:benchmark:check`.

## Environment

- Captured: 2026-07-14T22:39:24.271Z
- Node: v24.15.0
- Platform: linux 6.18.33.2-microsoft-standard-WSL2
- CPUs: 12
- Vitest: 4.1.10
- Projects: node, happy-dom, package overlays
- Max workers: 6
- Node pool: threads
- DOM pool: forks

## Inventory

- Test files: 209
- Listed tests: 1883

## Workspace commands

| Command | Mode | Median wall | Median RSS | Transform | Setup | Import | Tests | Environment |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `pnpm test` | cold | 65570ms | 1302004KB | 9.22s | 12.39s | 26.52s | 53.98s | 45.22s |
| `pnpm test` | warm | 60740ms | 1373552KB | 9.57s | 12.08s | 27.24s | 54.99s | 44.79s |
| `pnpm run test:coverage` | cold | 73140ms | 1320204KB | 9.4s | 13.76s | 27.64s | 62.74s | 44.65s |
| `pnpm run test:coverage` | warm | 70300ms | 1402372KB | 9.9s | 13.95s | 28.42s | 66.34s | 45.43s |

## Package-level commands

| Package | Category | Mode | Median wall | Files summary | Note |
| --- | --- | --- | ---: | --- | --- |

## Ranked optimization targets

1. **workspace tests** — 54.99s median warm (largest phase). Project-split workspace; tests phase in warm non-coverage run.
2. **workspace environment** — 44.79s median warm. Project-split workspace; environment phase in warm non-coverage run.
3. **workspace import** — 27.24s median warm. Project-split workspace; import phase in warm non-coverage run.
4. **package:repository** — 42577.254ms aggregated file time. 15 files / 92 tests in warm workspace run.
5. **package:query-kit** — 4072.679ms aggregated file time. 16 files / 135 tests in warm workspace run.
6. **package:toast** — 2930.87ms aggregated file time. 3 files / 58 tests in warm workspace run.
7. **package:gesture** — 1098.13ms aggregated file time. 7 files / 75 tests in warm workspace run.
8. **package:query** — 750.829ms aggregated file time. 11 files / 156 tests in warm workspace run.
9. **test/pack-check.test.ts** — 37340.506ms file duration. Slowest individual test file in warm workspace run.
10. **packages/query-kit/test/devtools.test.ts** — 3365.676ms file duration. Slowest individual test file in warm workspace run.
11. **test/architecture-check.test.ts** — 2867.726ms file duration. Slowest individual test file in warm workspace run.
12. **packages/toast/test/alpine.integration.test.ts** — 2851.024ms file duration. Slowest individual test file in warm workspace run.
13. **test/vitest-projects.test.ts** — 1375.624ms file duration. Slowest individual test file in warm workspace run.

## CI reference

Representative GitHub Actions timings from workflow runs on ubuntu-latest (Node 22).

- Full coverage (run `29303074025`): **1.15 min**
- Affected tests (run `29362602048`): **1.03 min**

Update `benchmarks/vitest-baseline.json` after refreshing local baselines. Compare future runs with:

```bash
node scripts/vitest-benchmark.mjs --runs 3
```

