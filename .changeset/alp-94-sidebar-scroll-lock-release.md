---
"@ailuracode/alpine-sidebar": patch
---

Fix scroll lock leaking when non-user transitions hide the sidebar.

- Release the held `scroll` lock whenever visibility becomes `false`, regardless of transition source (Escape, breakpoint, `reset()`, cross-tab storage).
- Lock acquisition remains user-driven only (`show()` / `toggle()`).
- Repeated show/hide calls stay idempotent.
