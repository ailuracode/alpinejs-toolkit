---
applyTo: 'packages/**/plugin.ts'
description: 'Alpine integration rules — plugin class, stores, magics, directives, public event dispatch. Load when editing or creating a plugin file under packages/.'
---

# Alpine integration

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded whenever
the agent touches `packages/**/plugin.ts`.

## Plugin class

Every package with Alpine integration MUST expose a class:

```typescript
export class FeaturePlugin implements AlpinePackage {
    register(Alpine): void;
    destroy?(): void;
}
```

The default export MAY remain as an Alpine-compatible factory:

```typescript
export default defineAlpinePlugin(FeaturePlugin);
```

The Alpine integration is responsible for: registering stores, magics, and
directives; creating controllers; wiring reactivity; translating events;
executing cleanup; and resolving the closest instance. The Alpine integration
MUST NOT contain the main logic of the feature — that lives in the
controller.

## Stores, magics, and directives

| Surface   | Use for                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Store     | Shared global state                                                                                                    |
| Magic     | Services, actions, closest-instance resolution, read-only APIs, contextual utilities                                   |
| Directive | Creating an instance, connecting an element, registering a part of a component, managing events or DOM-bound lifecycle |

Global stores MUST NOT be used to represent local components with multiple
instances.

## Public event dispatch

The Alpine layer MUST dispatch public events through `$dispatch`. It MUST NOT
use `dispatchEvent()` directly to replace `$dispatch` in public Alpine APIs.

Use native events when the behavior matches — `input`, `change`. Use
namespaced events when specific — `dialog:open`, `dialog:close`,
`tabs:change`, `carousel:select`.

## Public API exports

Stateful packages MUST export the controller and plugin from the main
entrypoint:

```typescript
export { FeatureController } from './controller.js';
export { FeaturePlugin } from './plugin.js';

export type { FeatureOptions, FeatureState, FeatureEvents } from './types.js';
```

A factory MAY be provided as a convenience API and MUST delegate to the public
class. Internal implementations MUST NOT be exported from the main
entrypoint.
