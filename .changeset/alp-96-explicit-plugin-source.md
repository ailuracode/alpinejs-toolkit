---
"@ailuracode/alpine-core": minor
---

Replace `Function.length` plugin-loader detection with explicit `PluginSource` discrimination via `pluginCallback()` and `pluginLoader()`. Direct Alpine callbacks (including zero-argument callbacks) are never invoked as factories; lazy sync and async factories must wrap with `pluginLoader()`.

**Migration:** change `plugin: () => themePlugin()` to `plugin: pluginLoader(() => themePlugin())`. Direct callbacks such as `plugin: (Alpine) => { ... }` or `plugin: () => { ... }` continue to work unchanged.
