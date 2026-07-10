---
applyTo: 'packages/**/*.ts'
description: 'TypeScript strict, banned types, casts, and SSR/browser safety rules for @ailuracode/alpinejs-toolkit.'
---

# TypeScript

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded for any
`.ts` file under `packages/`.

## Strict mode

All code MUST use TypeScript strict mode.

## Prohibited

- `any`.
- `@ts-ignore`.
- Unjustified assertions.
- Repeated casts that hide design problems.
- Public APIs that depend on internal types.

## Preferred

- `unknown` + type guards.
- Generics.
- Discriminated unions.
- Readonly types.
- Literal unions.
- `satisfies`.

Casts at external API boundaries MUST remain localized.

## SSR and browser safety

Browser APIs MUST NOT be accessed during import, in top-level constants, in
the constructor, or before the plugin is registered or mounted. Use core
helpers:

```typescript
isBrowser();
safeWindow();
safeDocument();
safeMatchMedia();
```

Importing any package MUST work in an environment without a DOM.
