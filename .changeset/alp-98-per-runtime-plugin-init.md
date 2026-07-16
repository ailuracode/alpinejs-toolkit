---
"@ailuracode/alpine-core": patch
---

Track plugin initialization per Alpine runtime with WeakMap-backed state and deduplicate concurrent async `initPlugins()` calls via a shared in-flight promise. Failed loads do not mark a plugin initialized and can be retried on the next call.

**Migration:** pass the Alpine instance to `isPluginInitialized(name, Alpine)` and `markPluginInitialized(name, Alpine)`. The mutable `initialized` field is removed from `PluginRegistryEntry`.
