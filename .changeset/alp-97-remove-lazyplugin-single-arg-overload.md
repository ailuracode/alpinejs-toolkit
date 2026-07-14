---
"@ailuracode/alpine-core": major
---

Remove the metadata-free `lazyPlugin(importFn)` overload. The single-function form built definitions with empty `kinds` and `names`, which `assertValidDefinition()` rejects in development and could bypass validation in production.

**Migration:** pass explicit kinds and names like `definePlugin()`:

```ts
// Before (removed)
lazyPlugin(async () => mod.default);

// After
lazyPlugin(["magic"], {
  names: ["share"],
  import: () => import("@ailuracode/alpine-transfer"),
});
```
