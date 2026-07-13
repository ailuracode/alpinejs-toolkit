---
"@ailuracode/alpine-query": patch
---

Unify `QueryCache` entry removal so `remove`, `removeEntry`, garbage collection, `reset`, and `destroy` share the same disposal path. Adapter `dispose` and devtools unsubscribe now run exactly once; timers and in-flight requests are canceled consistently on every removal path.
