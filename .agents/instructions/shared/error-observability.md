---
description: 'Error and observability policy for @ailuracode/alpinejs-toolkit. Always loaded.'
---

# Error & Observability

## Errors are values, not strings

Every public error MUST be an instance of `ToolkitError` (from `@ailuracode/alpine-core`). Errors MUST include:

1. A stable, uppercase, snake-case code as the first argument.
2. A context object (or typed detail) — never a free-form string only.

```typescript
throw new ToolkitError('PLUGIN_NOT_FOUND', {
    name,
    registeredNames: getRegisteredPlugins().map((p) => p.folder),
});
```

## Stable codes

Codes are part of the public API. Adding a code is a minor change. Renaming or removing a code is a breaking change and requires a major version bump + ADR.

Existing codes (non-exhaustive):

| Code                        | Meaning                                        |
| --------------------------- | ---------------------------------------------- |
| `PLUGIN_NOT_FOUND`          | A plugin name was requested but not registered |
| `PLUGIN_DUPLICATE`          | A plugin name was registered twice             |
| `PLUGIN_INVALID_DEFINITION` | Definition failed eager validation             |
| `PLUGIN_LOAD_FAILED`        | The dynamic import inside `lazyPlugin` failed  |
| `INVALID_OPTIONS`           | `normalizeXOptions` rejected input             |
| `INVALID_PAYLOAD`           | User-supplied JSON could not be parsed         |
| `TARGET_MISSING`            | Required DOM target is not in the document     |

Adding a new code requires updating the table here in the same PR.

## Async + safe degradation

Optional browser APIs (e.g. `matchMedia`, `Notification`, `IntersectionObserver`) MAY fail at runtime. The package MUST degrade gracefully — log to `console.warn` with the toolkit prefix and continue. A test MUST cover the degraded branch.

```typescript
try {
    return safeMatchMedia().matches;
} catch {
    // @coverage:ignore -- matchMedia absent in jsdom ≥ 26 baseline; covered by SSR test
    return false;
}
```

## Forbidden

- Empty `catch {}` blocks.
- Silent failure (catch + log nothing).
- String-matched errors (`if (err.message.includes("..."))`) — match on `ToolkitError.code` instead.

## Debug logging

When `debug: true` (or a custom `DebugLogger`) is enabled, transitions emit structured events through `defaultDebugLogger`. See `@ailuracode/alpine-debug` for the shape. Tests for `debug` MUST assert that a faulty logger does not throw and that the manager continues to apply transitions.

## Stack traces

Stack traces from user code MUST pass through `cause` (ES2022). Toolkit MUST NOT re-throw with `throw err` without preserving the chain.
