---
description: 'i18n and message policy for user-facing strings in @ailuracode/alpinejs-toolkit.'
---

# i18n & User-Facing Messages

## Default language

Source strings in the toolkit are **English (`en`)**. Consumers MAY translate; the toolkit does not ship translations.

## Where strings live

- Error messages emitted by `ToolkitError` MUST go through a small `formatMessage(code, ctx)` helper that the package exposes. The default returns the template string, but consumers MAY override the formatter to localize.
- Console warnings (`console.warn` from degraded paths) use English template literals. Translation is not supported — they are operator-facing, not user-facing.

## Authoring strings

- Use template literals for variables: `` `Storage quota exceeded for key "${key}"` ``, not concatenation.
- Capitalize the first word, end without a period when emitted as a console message. Periods are allowed in error templates.
- Avoid colloquialisms. The strings ship to many audiences.

## RTL

- Bindings that emit class names or data attributes MUST NOT include direction-dependent values.
- Consumers are responsible for direction CSS (logical properties — `margin-inline-start`, not `margin-left`).

## Numbers, dates, lists

- Use `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.ListFormat` — NEVER manual thousands separators or date formatting.
- The toolkit does not ship formatters; consumers bring their own. Bindings MAY return the raw values that consumers format themselves.

## Storage keys (theme, locale, etc.)

Storage keys MUST be configurable via the plugin options. Defaults MUST be unique per package — never a bare `"theme"` or `"locale"` (collisions). The default prefix is `@ailuracode/alpine-<name>:<key>` resolved to a kebab-case string.

For example, `@ailuracode/alpine-theme`'s default storage key is `alpine-theme:preference` (kebab-case, namespaced).
