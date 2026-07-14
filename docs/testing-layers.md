---
title: "Testing layers and environments"
description: "How Vitest and Playwright responsibilities are split across Node, simulated DOM, and real browsers."
---

# Testing layers and environments

Every test file in this repository has a **responsibility layer** (what contract it validates) and a **target environment** (the cheapest runtime that can validate it correctly). This taxonomy supports [ALP-130](https://linear.app/ailuracode/issue/ALP-130/classify-tests-by-node-simulated-dom-and-real-browser-responsibility) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).

The full file inventory lives in [`benchmarks/test-environment-inventory.json`](https://github.com/ailuracode/alpinejs-toolkit/blob/master/benchmarks/test-environment-inventory.json) and is regenerated with:

```bash
pnpm run test:classify
```

`repo:check` fails when the inventory drifts from the current test tree.

## Runtime environments

| Environment | Runner | When to use |
|-------------|--------|-------------|
| **`node`** | Vitest | Controller state machines, cache logic, parsing, utilities, SSR-safe imports, repository checks |
| **`happy-dom`** | Vitest | Alpine stores, magics, directives, and DOM APIs that happy-dom models reliably (root default today) |
| **`jsdom`** | Vitest | Packages that depend on jsdom-specific APIs (`localStorage` listeners, `scrollIntoView`, etc.) — see package `vitest.config.ts` |
| **`playwright`** | Playwright | Real focus, keyboard routing, layout, scroll locking, permissions, and browser-only APIs |

**Rule:** pick the cheapest environment that can validate the behavior. Controller logic that never touches DOM belongs in `node` even if it currently runs under happy-dom.

Per-file overrides use Vitest directives when needed:

```typescript
// @vitest-environment node
```

## Responsibility layers

| Layer | Filename patterns | Imports | Harness |
|-------|-------------------|---------|---------|
| **Controller** | `controller.test.ts`, `controller.spec.ts`, `*Controller.test.ts` | `../src/controller.js` and related modules — **not** `src/index.ts` | None (pure logic) or minimal DOM stubs when events require it |
| **Contract** | `contract.*`, `encapsulation.*`, `ssr.*` | Package entrypoint (`../src/index.js`) or built `dist/` | Node for SSR; DOM when validating browser helper contracts |
| **Integration** | `plugin.*`, `alpine.integration.*`, `adapter.*`, `magic.*`, `store.*` | Entrypoint or plugin module | `startAlpine()` for stores/directives; real Alpine for reactivity |
| **Accessibility** | `accessibility.*`, `a11y.*` | Controller or Alpine + DOM | Node when asserting metadata; DOM when asserting roles, focus, or keyboard |
| **Utility** | `parse.*`, `utils.*`, adapter unit tests under `adapters/` | Implementation modules | Node |
| **Repository** | `test/architecture-check.test.ts`, `test/pack-check.test.ts` | Node scripts and built artifacts | Node |
| **E2E** | `packages/<name>/e2e/*.spec.ts` | Playwright fixtures | Real browser — excluded from Vitest |

## Vitest vs Playwright overlap

Both layers may exercise similar user flows. **Do not delete a test because the scenario looks familiar.** Remove coverage only when another layer validates the **same public contract** reliably.

| Layer | Validates |
|-------|-----------|
| Vitest (simulated DOM) | Alpine registration, store/magic/directive wiring, expression evaluation, mocked browser APIs, ARIA attribute contracts |
| Playwright (real browser) | Focus traps, native keyboard routing, layout-sensitive positioning, scroll locking, portal stacking, permission prompts, clipboard/share |

Packages with both Vitest integration specs and Playwright projects are marked `complementary` in the inventory overlap table. Packages with simulated DOM but no E2E are marked `review` — confirm critical browser behavior is tracked.

See also: [E2E testing](./e2e-testing.md).

## Adding a new test

1. Choose the layer from the table above and name the file accordingly.
2. Import the narrowest module surface (controller tests → implementation modules; contract tests → entrypoint).
3. Use the harness from `.cursor/rules/testing.mdc` (`startAlpine`, `createMagicHarness`, `createQueryClient`, Playwright fixtures).
4. Run `pnpm run test:classify` and commit the updated inventory when adding or renaming test files.

## Package-local Vitest configs

These packages override the root happy-dom default:

| Package | Environment | Reason |
|---------|-------------|--------|
| `theme`, `sidebar`, `scroll`, `collection`, `ui` | `jsdom` | Storage, scroll, or layout APIs |
| `media`, `realtime` | `happy-dom` | Scoped setup while keeping happy-dom |

Individual files inside those packages may still target `node` when they do not touch DOM (see inventory `targetEnvironment` column).

## Related issues

- [ALP-131](https://linear.app/ailuracode/issue/ALP-131/split-vitest-into-node-and-simulated-dom-projects) — split Vitest projects by environment
- [ALP-133](https://linear.app/ailuracode/issue/ALP-133/move-tests-to-the-cheapest-correct-environment) — migrate tests to their target environment
