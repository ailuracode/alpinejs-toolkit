---
description: 'CSS and visual styling policy for @ailuracode/alpinejs-toolkit. Always loaded.'
---

# CSS Policy

Headless-only. The consumer owns every visual decision; the toolkit provides state, ARIA hooks, and behavior, not styles.

## Prohibited in `packages/**`

- Tailwind, UnoCSS, Bootstrap, or any utility-first / class-based framework.
- Hardcoded color values (`#fff`, `rgb(...)`, named colors) — use semantic tokens exposed by the consumer.
- Hardcoded themes: `data-theme="dark"` strings, `.dark` selectors inside `packages/`, etc.
- `!important`.
- Inline `style="..."` in user-facing output.
- Generated complete HTML structures unless the Web API requires it (e.g. `<dialog>`).
- Documented mandatory markup beyond what ARIA + the bindings return.

## Permitted

- Bindings MAY return plain ARIA object literals: `{ role: "dialog", "aria-modal": "true" }`.
- Bindings MAY emit tokens / semantic keys (`dark`, `light`, `system`) for the consumer to map to CSS variables.
- Pure utility functions MAY return CSS class names only if they are tokens (`"theme-dark"`, not `"bg-gray-900"`); consumers map the tokens to actual classes.

## Consumer responsibility

Consumers (apps, demos, presets) MAY use Tailwind or any other CSS framework. The toolkit does not prohibit it outside `packages/`.

## Naming tokens

Tokens that the toolkit exposes for the consumer SHOULD be namespaced: `--alpine-theme-*`, `data-alpine-theme`, `$store.theme`. Avoid `data-theme`, `data-color-mode`, etc., to prevent collisions with other libraries.
