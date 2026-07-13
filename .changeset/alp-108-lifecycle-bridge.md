---
"@ailuracode/alpine-core": minor
"@ailuracode/alpine-theme": patch
"@ailuracode/alpine-sidebar": patch
"@ailuracode/alpine-media": patch
"@ailuracode/alpine-scroll": patch
"@ailuracode/alpine-lang": patch
"@ailuracode/alpine-toast": patch
---

Extract a shared lifecycle bridge for controller-backed Alpine adapters. Adds `bridgeControllerStore`, `registerReactiveStore`, `registerStoreMagic`, and `wireControllerLifecycle` to `@ailuracode/alpine-core`. Migrates theme, sidebar, media, scroll, lang, and toast plugins to the shared helpers with explicit subscription unsubscribe on cleanup.
