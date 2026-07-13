---
"@ailuracode/alpine-core": minor
"@ailuracode/alpine-scroll": patch
"@ailuracode/alpine-media": patch
"@ailuracode/alpine-theme": patch
"@ailuracode/alpine-sidebar": patch
"@ailuracode/alpine-lang": patch
"@ailuracode/alpine-overlay": patch
"@ailuracode/alpine-toast": patch
"@ailuracode/alpine-dialog": patch
"@ailuracode/alpine-menu": patch
"@ailuracode/alpine-tooltip": patch
"@ailuracode/alpine-carousel": patch
"@ailuracode/alpine-virtual": patch
"@ailuracode/alpine-selection": patch
---

Extend the shared Alpine lifecycle bridge with `syncRecordFromSnapshot` and migrate instance-registry store adapters (`dialog`, `menu`, `tooltip`, `carousel`, `virtual`, `selection`, `overlay`) to `bridgeControllerStore` with explicit subscription teardown on cleanup.
