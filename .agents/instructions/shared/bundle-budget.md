---
description: 'Bundle size budget for @ailuracode/alpinejs-toolkit package dist output.'
---

# Bundle Budget

`dist/index.js` size is a public promise. The numbers below are gzipped kilobytes per package, measured by `scripts/bundle-budget.ts` (run via `bun run architecture:check`).

## Targets

| Category        | Budget (gzipped) | Examples                                               |
| --------------- | ---------------- | ------------------------------------------------------ |
| Core            | ≤ 5 kB           | `@ailuracode/alpine-core`                              |
| Feature         | ≤ 8 kB           | `@ailuracode/alpine-theme`, `@ailuracode/alpine-media` |
| Adapter         | ≤ 6 kB           | (future) `@ailuracode/alpine-query`                    |
| Preset          | ≤ 12 kB          | (future) `@ailuracode/alpine-starter`                  |
| Internal helper | ≤ 2 kB           | `@ailuracode/alpine-debug`                             |

## Measuring

`scripts/bundle-budget.ts` reads `packages/<name>/dist/index.js` after `bun run build:packages`, gzips it (`gzip -9` or `node:zlib gzip`), and fails if the package's category budget is exceeded.

## Raising a budget

A PR MAY raise a category budget. It MUST:

1. Update this file with the new number, the package that triggered the raise, and the date.
2. Add an ADR capturing the decision and the alternative considered (code split, lazy load, etc.).

## Tree-shaking guarantees

- `package.json` MUST declare `"sideEffects": false`.
- `package.json` MUST list every entry file under `exports`. Anything not listed is dead code from the consumer's perspective.
- Tree-shakeability MUST be preserved: no top-level side effects that import external libraries eagerly.

## Demo budget

Demos (anything under `demo/` or `*-demo/`) are not subject to these budgets. They ship their own bundles via Vite.
