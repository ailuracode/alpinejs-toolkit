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
pnpm add @ailuracode/alpine-scroll @ailuracode/alpine-core alpinejs
```

## Quick start

```ts
import Alpine from "alpinejs";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(scrollPlugin({ id: "scroll" }));
Alpine.start();
```

```html
<button x-on:click="$store.scroll.toTop()">Back to top</button>
<p>Scrolled: <span x-text="Math.round($store.scroll.progress)"></span>%</p>
```

## Public API

### `scrollPlugin(options?)`

Factory returning a `PluginCallback` for `Alpine.plugin()`. Options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | auto-generated | Controller identifier |
| `reserveScrollbarGap` | `boolean` | `true` | Reserve `--ailura-scrollbar-gap` on lock |
| `target` | `Element \| string \| null` | `null` | Element for scrollbar-gap compensation |

Registers `$store.scroll` and `$scroll` magic. Multiple registrations share the same singleton controller.

### `ScrollController`

Construct directly with `new ScrollController(options?)` for advanced consumers; the plugin auto-mounts.

#### Lifecycle

- `controller.mount()` — attaches scroll listener (idempotent).
- `controller.destroy()` — detaches listeners, releases singleton slot.

#### State

- `controller.state` — live snapshot: `x`, `y`, `direction`, `atTop`, `atBottom`, `progress`, `locked`, `lockCount`, `activeSection`, `visibleSections`.
- `controller.isLocked` — `true` when at least one lock is active.
- `controller.direction` — `'up' | 'down' | 'none'`.
- `controller.progress` — `0..100` scroll percentage.

#### Navigation

- `controller.scrollIntoView(target, options?)` — scroll element into view.
- `controller.by(delta, reason?)` — scroll by `{ x?, y? }`.
- `controller.toTop(reason?)` — scroll to top.
- `controller.toBottom(reason?)` — scroll to bottom.

#### Lock

- `controller.lockWithHandle(reason)` — acquires a lock, returns a handle string.
- `controller.unlock(handle)` — releases one lock.
- `controller.unlockAll()` — releases all locks.

#### Sections

- `controller.registerSection(id, options?)` — register an IntersectionObserver-backed section.
- `controller.unregisterSection(id)` — remove a section.

## Reduced motion

`prefers-reduced-motion: reduce` is honored by default — `smooth` scrolls degrade to `instant`. Disable with `respectReducedMotion: false`.

## Bundle

See `docs/adr/0002-scroll-bundle-exception.md` for the measured gzipped size + fallback split plan.

## License

MIT © ailuracode
