# `@ailuracode/alpine-scroll` v1.0.0

Headless scroll controller + Alpine plugin for `@ailuracode/alpinejs-toolkit`.

## What it does

Five concerns under one headless controller:

1. **Position tracking** — `ScrollState` exposes the live snapshot (`x`, `y`, `direction`, `atTop`, `atBottom`, `progress`).
2. **Body / scroll lock** — handle-based, ordered stack via `lockWithHandle` / `unlock(handle)`. Lock reason flows through `ScrollLockChangeDetail.reason`.
3. **Section observer** — IntersectionObserver-backed visibility tracker that fires `section` events.
4. **Navigation** — programmatic scroll with reduced-motion gate.
5. **Plugin integration** — `scrollPlugin(options)` factory wires the controller into `$store.scroll` and the `$scroll` magic.

## Install

```sh
pnpm add @ailuracode/alpine-scroll @ailuracode/alpine-core
```

## Quick start

```ts
import Alpine from "alpinejs";
import { ScrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(ScrollPlugin.init({ id: "scroll" }));
Alpine.start();
```

```html
<button x-on:click="$store.scroll.toTop()">Back to top</button>
<p>Scrolled: <span x-text="Math.round($store.scroll.progress)"></span>%</p>
```

## Public API

### `ScrollPlugin`

- `ScrollPlugin.init(options?)` — factory returning a `PluginCallback` for `Alpine.plugin()`.
- `plugin.register(Alpine)` — idempotent. Double-registration is a no-op.
- `plugin.dispose()` — tears down listeners and destroys the controller.

### `ScrollController`

Construct directly with `new ScrollController(options?)` for advanced consumers; the plugin auto-mounts.

// Lifecycle
controller.destroy();
```

The controller's `state` getter returns a frozen snapshot — external
code cannot mutate the live state. See
`.agents/adr/0002-scroll-bundle-exception.md` for the rationale behind
shipping a separate headless class.

## Reduced motion

`prefers-reduced-motion: reduce` is honored by default — `smooth` scrolls degrade to `instant`. Disable with `respectReducedMotion: false`.

## Bundle

See `.agents/adr/0002-scroll-bundle-exception.md` for the measured gzipped size + fallback split plan.

## License

MIT © ailuracode
