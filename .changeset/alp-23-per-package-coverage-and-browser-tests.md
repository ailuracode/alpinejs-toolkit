---
"@ailuracode/alpinejs-toolkit": minor
---

Enforce per-package coverage and add a real-browser test layer (ALP-23).

- **Per-package coverage gate**: `pnpm run test:coverage` now runs
  `scripts/per-package-coverage.mjs`, executing one Vitest run per package with
  its own ratcheted coverage floor from `scripts/coverage-policy.json`. A weakly
  tested package can no longer pass CI on another workspace's coverage.
- **Documented exceptions**: packages below the 40% minimum floor carry a
  justified `exempt` entry in the policy (e.g. `query-adapter-alpine`).
- **`repo:check`** now validates that every public, tested package declares a
  coverage floor or a documented exemption.
- **Real-browser suite**: `vitest.browser.config.ts` + `pnpm run test:browser`
  run focused Playwright/Chromium tests for the highest-risk accessibility and
  overlay contracts (dialog focus capture/restore, focus trap, keyboard
  navigation, escape/nested overlay stacks, portals, `aria-*`/`inert`). Browser
  tests live in `packages/<name>/test/browser/**/*.browser.test.ts` and are
  excluded from the happy-dom run and from `tsc`.
- Added `@vitest/browser-playwright` and `playwright` as dev dependencies and a
  `browser-tests` CI job that installs Chromium and runs the browser suite.
- Updated `.cursor/rules/{testing,coverage-thresholds}.mdc` to document the two
  test layers and the per-package policy.

Unit/controller tests remain in happy-dom; the global threshold in
`vitest.config.ts` is retained only as a backstop.
