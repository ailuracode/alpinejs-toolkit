---
"@ailuracode/alpine-query": minor
"@ailuracode/alpine-query-adapter-alpine": patch
"@ailuracode/alpine-query-kit": patch
---

Add `QueryCache.destroy()` and `QueryStore.destroy()` lifecycle cleanup for global focus/visibility listeners, query timers, in-flight requests, adapter handles, and devtools subscriptions. Focus listeners detach automatically when no observers remain. The Alpine query plugin wires teardown through `Alpine.cleanup()`.
