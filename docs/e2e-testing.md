---
title: "E2E testing"
description: "Per-package Playwright E2E infrastructure, local commands, CI policy, and anti-flake rules."
---

# Playwright E2E testing

End-to-end tests use **Playwright directly** (not Vitest browser mode). Each package that needs real-browser coverage owns its scenarios under `packages/<name>/e2e/` and exposes an independent `test:e2e` script.

## Test layers

| Layer | Runner | Location | Purpose |
|-------|--------|----------|---------|
| Controller / unit | Vitest + happy-dom | `packages/<name>/test/**` | State machines, events, cleanup, options |
| Alpine integration | Vitest + happy-dom | `packages/<name>/test/**` | Store, magic, directive registration |
| Contract / packed consumer | Vitest | `packages/<name>/test/**`, `test/**` | Published API and SSR-safe imports |
| **E2E (real browser)** | **Playwright** | `packages/<name>/e2e/**` | Real markup, focus, keyboard, layout, browser APIs |

Vitest remains the default for fast feedback. Playwright is reserved for behavior that requires a real browser runtime.

Full layer and environment taxonomy: [Testing layers](./testing-layers.md). File inventory: `test/inventory/test-environment-inventory.json` (`pnpm run test:classify`).

## Layout

```text
e2e/
  playwright.base.ts      # shared config factory
  fixtures.ts             # shared fixtures + Alpine boot helper
  server/                 # deterministic fixture HTTP server
packages/<name>/
  playwright.config.ts    # package-owned Playwright project
  e2e/
    fixture/
      index.html          # minimal Alpine markup
      main.ts             # registers the package plugin
    *.spec.ts             # Playwright specs
```

Shared infrastructure lives at the repository root. **Scenarios stay inside the owning package** — there is no centralized `e2e/packages/*` directory.

## Local commands

```bash
# Install Chromium (required baseline)
pnpm run playwright:install

# Run every package project that defines playwright.config.ts
pnpm run test:e2e

# Run only packages affected by the current git diff
pnpm run test:e2e:affected

# Run one package independently
pnpm --filter @ailuracode/alpine-theme test:e2e

# Cross-browser + mobile matrix (scheduled / manual full run)
pnpm run playwright:install:all
pnpm run test:e2e:full
```

Open the HTML report after a failure:

```bash
pnpm --filter @ailuracode/alpine-theme test:e2e:report
```

## Adding E2E to a package

1. Create `packages/<name>/e2e/fixture/index.html` and `main.ts`.
2. Add specs under `packages/<name>/e2e/*.spec.ts`.
3. Add `playwright.config.ts` that calls `definePackagePlaywrightConfig()` from `e2e/playwright.base.ts`.
4. Add `"test:e2e": "playwright test --config playwright.config.ts"` to the package `package.json`.

The shared fixture server bundles `e2e/fixture/main.ts` with esbuild, resolves workspace aliases from `tsconfig.json`, and serves `/`, `/app.js`, and `/__health`. Playwright starts and stops the server through `webServer`, so ports are not leaked between runs.

## Selectors and accessibility

- Prefer **roles** and accessible names: `page.getByRole('button', { name: 'Save' })`.
- Use `data-testid` only when roles are insufficient.
- Assert accessibility in E2E with role visibility/enabled checks; keep detailed ARIA contracts in happy-dom tests when DOM APIs are mocked.
- Avoid CSS classes, XPath, and positional selectors unless there is no semantic alternative.

## Waiting policy

- Rely on Playwright auto-waiting (`expect(locator)...`, `getByRole`, `click`).
- Do **not** use arbitrary `page.waitForTimeout()`.
- Use `waitForAlpineFixture()` from `e2e/fixtures.ts` only to gate initial Alpine boot (`data-e2e-ready="true"`).
- Treat uncaught page errors as test failures (configured in shared fixtures).

## Anti-flake rules

- Keep fixtures minimal — one plugin, one page, deterministic markup.
- Reset state in HTML/fixture code, not by reloading storage manually in every spec.
- Run with `workers: 1` in CI.
- Use `retries: 2` in CI only.
- Capture `trace`, `screenshot`, and `video` on failure (configured in the base config).

## CI policy

| Event | Browsers | Scope |
|-------|----------|-------|
| Pull request | Chromium | Affected packages with Playwright projects |
| `master` push / global tooling | Chromium | All package E2E projects when infra changes |
| Weekly schedule | Chromium, Firefox, WebKit, Pixel 5 | Full matrix via `E2E_BROWSER_PROFILE=full` |

Failed CI runs upload `packages/*/e2e/playwright-report/**` and `packages/*/e2e/test-results/**` artifacts.

## Debugging

```bash
# Run headed locally
PWDEBUG=1 pnpm --filter @ailuracode/alpine-theme test:e2e

# UI mode
pnpm --filter @ailuracode/alpine-theme exec playwright test --config playwright.config.ts --ui
```

When a spec fails locally:

1. Open the HTML report (`test:e2e:report`).
2. Inspect trace, screenshot, and video attachments.
3. Re-run the single spec with `--debug` or `--headed`.

## TypeScript

`packages/*/e2e/**/*.ts` and `e2e/**/*.ts` are included in the root `tsconfig.json`. E2E specs are excluded from Vitest via `vitest.config.ts` `exclude` patterns.
