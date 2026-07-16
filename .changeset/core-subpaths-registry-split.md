---
"@ailuracode/alpine-core": major
"@ailuracode/alpine-plugin-registry": minor
---

Split plugin registry APIs into `@ailuracode/alpine-plugin-registry` and add granular `@ailuracode/alpine-core/*` subpath exports (`browser`, `controller`, `bridge`, `registration`, `singleton`, `events`, `types`).

Performance: `EventEmitter.emit` skips listener snapshots when no `once` handlers are registered; `dispatchPluginEvent` clones detail only when `clone` is set; `syncRecordFromSnapshot` uses a single-pass stale-key sweep.
