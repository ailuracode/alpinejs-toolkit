---
applyTo: 'packages/**'
description: 'Headless constraints, accessibility (WAI-ARIA), CSS, and external dependency rules. Load when working on any package surface (markup, a11y, deps).'
---

# Headless UI

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded for any
work under `packages/`.

## Accessibility

Headless components MUST implement the applicable WAI-ARIA pattern. Every
component MUST cover: roles, ARIA attributes, keyboard navigation, focus
management, disabled states, orientation, direction, ID relationships,
dynamic items, cleanup, and restore focus when applicable. Accessibility MUST
NOT depend on the exact markup of the demo. The package provides state,
props, and behavior, not styles.

## CSS and markup

Packages MUST be headless. Prohibited: Tailwind classes, CSS framework
assumptions, hardcoded themes, hardcoded `data-theme`, undocumented mandatory
markup, and inserting complete HTML structures unless the Web API requires
it. Bindings MAY return plain ARIA objects such as
`{ role: "dialog", "aria-modal": "true" }`. The consumer controls markup and
styles.

## External dependencies

An external dependency MUST:

1. Solve a complex part of the domain.
2. Be encapsulated behind the controller.
3. Not leak unnecessarily into the public API.
4. Be destroyed correctly.
5. Be replaceable in the future.

Examples: `carousel` → Embla Carousel, `calendar` → date-fns, `tooltip` →
Floating UI. The chosen dependency's robust functionality MUST NOT be
reimplemented internally.
