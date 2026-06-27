---
"@ailuracode/alpine-lang": minor
---

Add `@ailuracode/alpine-lang` — a reactive `$store.lang` store that detects the browser language, exposes `current` / `base` / `region` / `languages`, and supports dynamic language switching via `set()` / `reset()` / `is()` / `includes()`. Does not translate content — pair it with any i18n library via the `onChange` callback.