---
applyTo: 'packages/**/test/**'
description: 'Testing rules — layer split (controller, integration, a11y, contract), thresholds, mandatory tests. Load when working inside packages/**/test.'
---

# Testing

Detailed rules for [AGENTS.md](../../AGENTS.md). This file is loaded whenever
the agent touches `packages/**/test/**`.

Tests MUST be split by layer.

## Controller tests

Cover: initial state, transitions, invariants, events, options, errors,
idempotency, and cleanup. Alpine MUST NOT be initialized unless strictly
required.

## Alpine integration tests

Cover: plugin registration, stores, magics, directives, reactivity,
`$dispatch`, expression evaluation, cleanup, and multiple instances.

## Accessibility tests

Cover: ARIA props, focus, keyboard navigation, disabled elements, dynamic
elements, restore focus, roving tabindex, and `aria-activedescendant` when
applicable.

## Integration tests

Cover real external dependencies when reasonable — for example Embla
initialization and destruction, Floating UI cleanup, and browser observers.

## Contract tests

Core MUST provide reusable tests to validate: controller lifecycle, idempotent
destroy, event subscription cleanup, SSR-safe imports, plugin registration,
multiple independent instances, and no leaked global listeners. Packages
MUST run the applicable contract tests.

## Thresholds

Every behavior change MUST include tests. Global thresholds MUST NOT be
lowered to make a contribution pass.
