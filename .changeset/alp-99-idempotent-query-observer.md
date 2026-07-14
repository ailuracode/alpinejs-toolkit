---
"@ailuracode/alpine-query": patch
---

Fix `observe()` returning a shared `destroy()` that was not idempotent per subscription. Each observer now gets its own release handle while sharing the underlying query state via `observer.state`.
