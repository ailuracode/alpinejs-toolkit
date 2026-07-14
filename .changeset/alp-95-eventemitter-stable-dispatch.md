---
"@ailuracode/alpine-core": patch
---

Fix `EventEmitter.emit()` to iterate a shallow snapshot so listener removals during dispatch cannot skip subsequent listeners, and remove `once()` registrations before invocation so re-entrant emits cannot fire them twice.
