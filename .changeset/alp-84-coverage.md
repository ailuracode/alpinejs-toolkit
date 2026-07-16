---
---

ALP-84: Increase unit test coverage across the monorepo.

- Added comprehensive test suites for `query` cache, `query-kit` devtools and adapters, `permissions` controller and plugin, `env` platform/visibility modules, `attention`/`geo`/`notify` permission adapters, `virtual` observers, `calendar` selection helpers, and headless UI controllers (tabs, menu, accordion, dialog, command).
- Added coverage infrastructure: `json`/`json-summary` reporters, `scripts/coverage-report.mjs` debt report, coverage exclusions for type-only files, and updated `vitest.config.ts` thresholds.
- Coverage improved from baseline 82.50% lines / 73.14% branches to 87.30% lines / 80.13% branches.
