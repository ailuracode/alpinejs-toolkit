---
applyTo: 'packages/**/index.ts'
description: 'Public API surface rules — exports, options, errors, package metadata, changesets. Load when editing or creating a package entrypoint.'
---

# Public API

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded whenever
the agent touches `packages/**/index.ts`.

`src/index.ts` MUST only contain exports and minimal global declarations. It
MUST NOT contain extensive implementations.

## Required exports

Stateful packages MUST export:

```typescript
export { FeatureController } from './controller.js';
export { FeaturePlugin } from './plugin.js';

export type { FeatureOptions, FeatureState, FeatureEvents } from './types.js';
```

A factory MAY be provided as a convenience API:

```typescript
export function createFeature(options?: FeatureOptions): FeatureController {
    return new FeatureController(options);
}
```

The factory MUST use the public class and MUST NOT keep a second
implementation. Internal implementations MUST NOT be exported from the main
entrypoint.

## Package structure

```text
packages/<name>/
├── src/
│   ├── index.ts
│   ├── controller.ts
│   ├── plugin.ts
│   ├── types.ts
│   ├── events.ts
│   ├── options.ts
│   ├── alpine/
│   │   ├── directives.ts
│   │   ├── store.ts
│   │   ├── magic.ts
│   │   └── bindings.ts
│   ├── internal/
│   └── global.d.ts
├── test/
├── package.json
└── README.md
```

Small packages MAY combine `types.ts`, `events.ts`, and `options.ts`, but
MUST keep separate: headless logic, Alpine integration, and public API.

## Options

Options MUST be readonly. Defaults MUST be normalized once via a dedicated
`normalizeXOptions(options)` function and MUST NOT be repeated across
controller, plugin, directives, store, or tests. Invalid options MUST
produce descriptive errors or be normalized explicitly; they MUST NOT be
silently ignored.

```typescript
export interface DialogOptions {
    readonly closeOnEscape?: boolean;
    readonly closeOnOutsideClick?: boolean;
}
```

## Errors

Public errors MUST extend a common `ToolkitError` when applicable and MUST
include stable codes when they can be handled programmatically. Empty
`catch {}` blocks MUST NOT be used. Configuration errors MUST NOT be hidden.
Errors caused by optional browser APIs MAY degrade in a controlled and
documented way.

## Package metadata

Every package MUST include:

```json
{
    "type": "module",
    "sideEffects": false,
    "publishConfig": { "access": "public" }
}
```

Names MUST follow `@ailuracode/alpine-<name>`. Packages MUST publish ESM,
type declarations, sourcemaps, README, and global type augmentation when
applicable. Peer dependencies MUST NOT be bundled.

## Changesets

Every consumer-observable change MUST include a changeset using `patch` for
backward-compatible fixes, `minor` for backward-compatible new APIs, and
`major` for breaking changes. Versions MUST NOT be edited manually. Internal
changes with no public impact MAY skip a changeset only when they do not
modify the bundle, behavior, or public types.
