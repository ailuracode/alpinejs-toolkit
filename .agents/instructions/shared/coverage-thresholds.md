---
description: 'Numeric coverage thresholds and ignore-policy for @ailuracode/alpinejs-toolkit packages.'
---

# Coverage Thresholds

Numeric thresholds enforced by `scripts/coverage-check.ts` (run via `bun run architecture:check`).

## Targets

| Metric     | Target |
| ---------- | ------ |
| Lines      | ≥ 90 % |
| Branches   | ≥ 85 % |
| Functions  | ≥ 90 % |
| Statements | ≥ 90 % |

These targets are global averages across `packages/`. Individual packages MAY lag temporarily while a feature lands; a PR that lowers the global average is blocked.

## `@coverage:ignore` policy

Use `// @coverage:ignore <reason>` comments sparingly and only for:

1. Defensive `try`/`catch` around optional browser APIs that exercise paths jsdom cannot reproduce (e.g. `matchMedia` missing, `Notification.permission` denial).
2. Edge cases that depend on platform-specific behavior outside the test harness.

Each comment MUST include a reason after the directive:

```typescript
if (typeof window === 'undefined') {
    // @coverage:ignore -- SSR branch without DOM, exercised by SSR integration test
    return null;
}
```

Comments without a reason are removed by `tooling-configs-check.ts`.

## Excluded files

The coverage report MUST exclude:

- `src/internal/**/*.test.ts` (internal self-tests may exist)
- `src/types.ts` and any `*.d.ts`
- `src/global.d.ts`
- Any file matching `*.spec-helper.ts`

To extend the exclude list, edit `vitest.config.ts` at the root and re-run `bun run architecture:check`.

## Raising targets

Targets MAY be raised by a PR that:

1. Includes the code that justifies the raise.
2. Updates this file.
3. Updates `vitest.config.ts` thresholds to match.
4. Adds an ADR capturing the new target and the date.

Targets MUST NOT be lowered.
