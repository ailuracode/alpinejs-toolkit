---
"@ailuracode/alpine-toggle": patch
"@ailuracode/alpine-lang": patch
---

Move initialization side effects out of `ToggleController` and `LangController` constructors.

- `ToggleController` no longer schedules microtasks or emits events during construction; `mount()` owns the initialization `change` event.
- `LangController` no longer reads the global `navigator` during construction; browser detection runs in `mount()` when no navigator is injected.
- `createToggle()` and `createLang()` continue to return fully initialized controllers by constructing and mounting internally.
