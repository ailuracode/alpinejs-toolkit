---
applyTo: 'packages/**'
description: 'Architecture, package classification, core dependency, and inter-package direction rules for the @ailuracode/alpinejs-toolkit monorepo. Load when working inside packages/.'
---

# Architecture

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded for any
work under `packages/`.

## Overall architecture

Every package follows this separation:

```text
Headless domain controller
        ↓
Alpine integration adapter
        ↓
Directives, stores, magics, and bindings
```

Domain logic MUST NOT be implemented inside Alpine callbacks.

## Mandatory core dependency

Every published package, except `@ailuracode/alpine-core` itself, MUST rely on
`@ailuracode/alpine-core`.

Each package MUST declare:

```json
{
    "peerDependencies": {
        "@ailuracode/alpine-core": "^0.1.0",
        "alpinejs": "^3.0.0"
    },
    "devDependencies": {
        "@ailuracode/alpine-core": "workspace:*"
    }
}
```

Packages MUST NOT include a private or bundled copy of
`@ailuracode/alpine-core`. Core MUST NOT import any feature package.

Inter-package dependencies MUST follow this direction:

```text
core → feature → adapter/preset → application
```

Circular dependencies are not allowed.

## Core responsibilities

`@ailuracode/alpine-core` contains exclusively reusable infrastructure.

It MAY provide:

- `Controller`, `BaseController`
- `TypedEventEmitter`, `CleanupStack`, `InstanceRegistry`
- `ToolkitError`
- Browser capability helpers
- Alpine plugin contracts
- Store / magic / directive adapters
- Alpine event dispatching
- Lazy plugin registry, plugin initialization

An abstraction MUST only be added to core when:

1. It is generic.
2. It contains no feature-specific behavior.
3. It is used (or will be used) by at least two packages.
4. It can be tested independently.

Core MUST NOT become a container of feature-specific helpers.

## Package classification

Every package MUST declare an architectural category.

| Category      | Purpose                                   | Allowed surface                       | Examples                                                                        |
| ------------- | ----------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| **Service**   | Global / app-wide shared state            | Alpine store, magic, singleton        | Theme, Media, Scroll, Toast, Language, Environment                              |
| **Component** | Headless component, one or more instances | Per-instance controller (primary API) | Dialog, Menu, Tooltip, Tabs, Accordion, Command, Carousel, Combobox, Navigation |
| **Utility**   | Functionality with no UI or limited state | Plain functions                       | Transfer, Calendar, Toggle, Child, JSON:API                                     |
| **Adapter**   | Connects a contract to an external tech   | Wraps the main package                | Query Alpine, Query Zustand, Nanostores                                         |
| **Preset**    | Bundles and configures multiple packages  | Depends on features, no copies        | App starter preset                                                              |

Components MUST NOT use a global store as the primary source of state. A
global registry keyed by ID MAY exist for imperative access, but state and
lifecycle belong to each instance's controller.

An adapter MUST NOT reimplement the logic of its main package. A preset MUST
NOT contain copies of feature implementations.
