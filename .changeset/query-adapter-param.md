---
"@ailuracode/alpine-query": minor
"@ailuracode/alpine-query-adapter-alpine": patch
"@ailuracode/alpine-query-adapter-nanostores": patch
"@ailuracode/alpine-query-adapter-zustand": patch
---

Add `query({ adapter })` as the primary Alpine plugin API. Pass a state adapter, then the plugin registers `$store.query`. Adapter packages export factories for use with `query()`.
