# Vitest tuning decisions (ALP-134)

Recorded evidence for [ALP-134](https://linear.app/ailuracode/issue/ALP-134/benchmark-and-tune-vitest-execution-settings) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).

Settings live in `scripts/vitest-runtime-settings.mjs` and are applied by `scripts/vitest-projects.mjs` plus package overlay `vitest.config.ts` files.

## Before / after (structural + tuning)

Measured on linux WSL2, Node v24, Vitest 4.1.10, 12 CPUs. Warm single runs unless noted.

| Stage | Wall | Environment | Notes |
| --- | ---: | ---: | --- |
| ALP-128 baseline (global happy-dom) | ~57.5s | ~168.6s | 226 files, pre-project split |
| ALP-131–133 (project split only) | ~53.6s | ~67.4s | 208 files, default forks pool |
| ALP-134 tuning (`threads` node + capped workers) | ~60.7s | ~44.8s | Committed baseline (`benchmarks/vitest-baseline.json`, 2026-07-14) |

Coverage output and thresholds were unchanged across all stages.

## Adopted settings

| Project kind | `pool` | `maxWorkers` | `isolate` | Rationale |
| --- | --- | --- | --- | --- |
| `node` | `threads` | `max(2, min(6, floor(cpus/2)))` | `true` | Lower transform/setup/import cost vs forks |
| `happy-dom` overlays | `forks` | same | `true` | Process isolation for DOM globals and setup side effects |

Override workers locally or in CI with `VITEST_MAX_WORKERS`.

## Rejected settings

| Setting | Evidence | Decision |
| --- | --- | --- |
| `isolate: false` on `node` | 40+ failures first run, 25+ on rerun | **Rejected** — singleton cleanup insufficient |
| `pool: threads` for DOM projects | Marginal wall gain, higher flake risk with shared DOM | **Rejected** — keep forks for DOM |
| `pool: vmThreads` / `vmForks` | Not benchmarked after project split | **Rejected** — no measured gain over threads/forks |
| `deps.optimizer` | No warm-run improvement after split | **Rejected** — complexity across overlay configs |
| Uncapped `maxWorkers` (12 on local) | Higher environment phase vs capped runs | **Rejected** — cap at half CPUs (max 6) |

## Pool benchmark matrix (warm, full workspace)

| Config | Wall | Environment |
| --- | ---: | ---: |
| forks (default) | 52.1s | 73.4s |
| threads | 51.6s | 64.4s |
| forks + `maxWorkers: 6` | 51.3s | 44.6s |
| threads + `maxWorkers: 6` | 52.3s | 41.8s |

Adopted combination: **per-project pools** with shared worker cap.

## Fake timers

Several query, keyboard, media, and toast suites already use `vi.useFakeTimers()`. Remaining real `setTimeout` usage is intentional (Alpine microtasks, scroll adapter timing, realtime transport). No global fake-timer default was added.

## Known slow suites

From post-split warm runs (see `benchmarks/vitest-baseline.json`):

1. `test/pack-check.test.ts` — tarball validation across publishable packages
2. `packages/ui/test/contract.spec.ts` — packed consumer surface
3. `packages/query-kit/test/devtools.test.ts` — devtools panel lifecycle
4. `test/architecture-check.test.ts` — monorepo invariant scan
5. `packages/query-kit/test/panel-preferences.test.ts` — persisted devtools prefs

Future optimization should target Node-only refactors for repository checks or slimmer pack fixtures — not broader DOM downgrades.

## Regression checks

Tolerance-based comparison: `pnpm run test:benchmark:check` ([ALP-135](https://linear.app/ailuracode/issue/ALP-135/add-vitest-performance-regression-checks-and-finalize-ci-integration)).

- Wall time warn: **1.25×** baseline median
- Environment warn: **1.30×** baseline median
- Wall time fail: **1.50×** baseline median or test failures

Scheduled CI publishes `benchmarks/vitest-performance-report.json` on Monday full runs.
