---
"@ailuracode/alpine-accordion": patch
"@ailuracode/alpine-attention": patch
"@ailuracode/alpine-calendar": patch
"@ailuracode/alpine-carousel": patch
"@ailuracode/alpine-child": patch
"@ailuracode/alpine-collection": patch
"@ailuracode/alpine-command": patch
"@ailuracode/alpine-dialog": patch
"@ailuracode/alpine-env": patch
"@ailuracode/alpine-form": patch
"@ailuracode/alpine-geo": patch
"@ailuracode/alpine-gesture": patch
"@ailuracode/alpine-history": patch
"@ailuracode/alpine-keyboard": patch
"@ailuracode/alpine-lang": patch
"@ailuracode/alpine-media": patch
"@ailuracode/alpine-menu": patch
"@ailuracode/alpine-notify": patch
"@ailuracode/alpine-overlay": patch
"@ailuracode/alpine-permissions": patch
"@ailuracode/alpine-plugin-registry": patch
"@ailuracode/alpine-query-adapter-alpine": patch
"@ailuracode/alpine-realtime": patch
"@ailuracode/alpine-scroll": patch
"@ailuracode/alpine-selection": patch
"@ailuracode/alpine-sidebar": patch
"@ailuracode/alpine-tabs": patch
"@ailuracode/alpine-theme": patch
"@ailuracode/alpine-timer": patch
"@ailuracode/alpine-toast": patch
"@ailuracode/alpine-toggle": patch
"@ailuracode/alpine-tooltip": patch
"@ailuracode/alpine-transfer": patch
"@ailuracode/alpine-virtual": patch
---

Dedupe `@ailuracode/alpine-core` subpath imports via internal `core-deps` barrels so tsup emits one external import per subpath. No public API changes.
