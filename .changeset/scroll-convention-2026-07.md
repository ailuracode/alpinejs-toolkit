---
"@ailuracode/alpine-scroll": major
---

Align the plugin entrypoint with the factory convention shared by `@ailuracode/alpine-theme`, `@ailuracode/alpine-lang`, and `@ailuracode/alpine-sidebar`. The package now exposes `scrollPlugin(options)` as a named factory that returns the `Alpine.plugin()` callback; the headless `ScrollController` is the framework-agnostic primitive that the adapter wires into `$store.scroll` and the `$scroll` magic.

**Breaking changes:**

- Drop the default export and the `ScrollPlugin` class. Import the named `scrollPlugin` factory instead:
  ```diff
  - import scroll, { ScrollPlugin } from "@ailuracode/alpine-scroll";
  - Alpine.plugin(scroll({ id: "scroll" }));
  - // or
  - Alpine.plugin(ScrollPlugin.init({ id: "scroll" }));
  + import { scrollPlugin, ScrollController } from "@ailuracode/alpine-scroll";
  + Alpine.plugin(scrollPlugin({ id: "scroll" }));
  + const controller = new ScrollController({ id: "scroll" });
  + controller.mount();
  ```
- The `$scroll` magic now returns the same reactive `ScrollStore` proxy as `$store.scroll` (mirrors `$theme` / `$sidebar` / `$lang`). The v0.x behaviour of returning the controller is gone. Use `$store.scroll.toTop()` / `$store.scroll.lock("modal")` / etc. for the public command surface. If you need the full controller API (e.g. `registerSection` / `unregisterSection` / `reset` / `lockWithHandle` / `toElement`), construct a `ScrollController` instance yourself.
- `plugin.dispose()`, `plugin.options`, and `plugin.controller` getters are removed. The `Alpine.cleanup()` callback now owns the teardown path — firing it once unsubscribes the `change` listener and calls `controller.destroy()`. The factory closure is single-invocation; do not call it twice against the same Alpine runtime.
- `registerScrollMagic`, `AlpinePackage`, and the `ScrollPlugin` class are no longer exported. The plugin adapter is self-contained in `src/plugin.ts`.

**Not breaking:**

- The `$store.scroll` surface (`.x`, `.y`, `.direction`, `.atTop`, `.atBottom`, `.progress`, `.locked`, `.lockCount`, `.activeSection`, `.visibleSections`, `.scrollIntoView(...)`, `.by(...)`, `.toTop()`, `.toBottom()`, `.lock(...)`, `.unlock(...)`, `.unlockAll()`) is unchanged.
- `ScrollOptions` (`id`, `defaultBehavior`, `respectReducedMotion`, `reserveScrollbarGap`) is unchanged.
- The `change` / `lock` / `section` / `scroll` / `reach` / `navigation` event names + detail shapes are unchanged.
- The `ScrollMagicListener` type alias is preserved.

**Internal:**

- Removed `src/alpine/magic.ts` (helper inlined into `src/plugin.ts`). The adapter subscribes once to the controller's `change` event for reactivity bridging; the controller's `lock` and `section` events no longer carry duplicate writes into the store because the controller's `change` event already folds them in.
- Added `ScrollAlpine` typed view + `ScrollPluginCallback` plugin-callback alias to `src/types.ts`. Mirrors `SidebarAlpine` / `LangAlpine` and pins the typed `Alpine.store("scroll")` / `Alpine.magic("scroll")` surface to `ScrollStore`.
- Plugin subscription is created exactly once per factory invocation; `Alpine.cleanup(() => { unsubscribe(); controller.destroy(); })` is the single teardown path.
