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

Extract a shared Alpine lifecycle bridge (`@ailuracode/alpine-core/alpine`) and migrate controller-backed store adapters to use it. Subscription teardown is now explicit on every migrated plugin; `syncRecordFromSnapshot` replaces duplicated instance-registry sync helpers.
