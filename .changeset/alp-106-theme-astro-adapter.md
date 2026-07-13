---
"@ailuracode/alpine-theme": major
---

Move Astro View Transition re-apply listeners out of the default `themePlugin()` registration. Astro apps should import from `@ailuracode/alpine-theme/astro` or pass `reapplyEvents`. Adds `bindThemeReapplyEvents()` for custom framework integrations.
