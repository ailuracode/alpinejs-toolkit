---
"@ailuracode/alpine-sidebar": patch
---

Fix incorrect `previous.matchesBreakpoint` snapshots on breakpoint and reset transitions.

- Breakpoint events now report the true prior `matchesBreakpoint` value alongside `previous.visible`.
- `reset()` emits when only breakpoint state changes and stays a no-op when neither field moves.
