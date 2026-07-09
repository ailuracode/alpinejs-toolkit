---
"@ailuracode/alpine-scroll": minor
---

Promote the scroll controller to the same singleton pattern used by `@ailuracode/alpine-theme`, `@ailuracode/alpine-lang`, and `@ailuracode/alpine-sidebar`. The package now exports a `createScroll(options)` factory that returns the document's single `ScrollController`; `scrollPlugin()` uses it internally so multiple plugin registrations share state.

**New API:**

- `createScroll(options?: ScrollOptions): ScrollController` — singleton getter. Repeated calls return the same controller for the current document. The first call's `options` win on subsequent calls (the singleton is built once). `controller.destroy()` releases the slot so the next call builds a fresh controller.
- `SCROLL_SINGLETON_KEY: "@ailuracode/alpine-scroll/default"` — stable registry key, exported for advanced consumers / tests that want to target the slot directly.

**Behaviour:**

- `scrollPlugin(options)` calls `createScroll(options)` internally. The plugin and the headless factory now resolve to the same controller, so `$store.scroll.lock("modal")` (via the plugin's store) and `createScroll().isLocked` (via the factory) observe the same lock state.
- Singleton is enforced per `document` — tests that need a fresh controller per case call `clearAllSingletons()` (or `clearSingleton(SCROLL_SINGLETON_KEY)`) between cases.
- `controller.destroy()` clears the singleton slot so the next `createScroll()` call builds a brand-new controller. Same shape as `createSidebar()` / `createTheme()` / `createLang()`.

**Not breaking:**

- `ScrollController` class is still exported so tests and advanced consumers can construct directly with `new ScrollController(options)`.
- `scrollPlugin()` API is unchanged — same `(options) => PluginCallback` factory.
- `$store.scroll` / `$scroll` magic surface unchanged.

**Migration from v1.0.0:**

```diff
 // Standalone (no Alpine)
-import { ScrollController } from "@ailuracode/alpine-scroll";
-const controller = new ScrollController({ id: "scroll" });
+import { createScroll } from "@ailuracode/alpine-scroll";
+const controller = createScroll({ id: "scroll" });
 controller.mount();   // optional — createScroll() mounts automatically

 // Alpine
 import { scrollPlugin } from "@ailuracode/alpine-scroll";
 Alpine.plugin(scrollPlugin({ id: "scroll" }));  // unchanged

 // Access the singleton from anywhere in the app
-import { ScrollController } from "@ailuracode/alpine-scroll";
-Alpine.plugin(scrollPlugin({ id: "scroll" }));
-const controller = new ScrollController();  // ← second instance, separate state!
+import { createScroll } from "@ailuracode/alpine-scroll";
+Alpine.plugin(scrollPlugin({ id: "scroll" }));
+const controller = createScroll();          // ← same instance as the plugin owns
```