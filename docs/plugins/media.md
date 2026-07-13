---
title: "Media"
description: "Package: @ailuracode/alpine-media"
---

Package: `@ailuracode/alpine-media`

Reactive viewport breakpoints, dimensions, and browser media features in a single Alpine store. Uses `matchMedia` for breakpoint and feature detection and debounced `resize` updates for width and height.

## Install

```bash
pnpm add @ailuracode/alpine-media @ailuracode/alpine-core alpinejs
```

## Setup

```ts
import Alpine from "alpinejs";
import { mediaPlugin } from "@ailuracode/alpine-media";

Alpine.plugin(mediaPlugin());
Alpine.start();
```

## Default intervals

| Name    | Range     |
| ------- | --------- |
| Mobile  | ≤ 767 px  |
| Desktop | ≥ 768 px  |

## Custom intervals

You can define arbitrary interval names and breakpoints. Intervals are checked **smallest-first** — the first `(max-width: Xpx)` query that matches wins.

```ts
import Alpine from "alpinejs";
import { mediaPlugin, mediaIntervals } from "@ailuracode/alpine-media";

Alpine.plugin(
  mediaPlugin({
    intervals: mediaIntervals([
      { name: "phone", maxWidth: 480 },
      { name: "tablet", maxWidth: 768 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const),
  })
);
Alpine.start();
```

`as const` (or `mediaIntervals([...] as const)`) is what preserves the literal type of `breakpoint` end-to-end.

## Store API

Store name: `$store.media` (and `$media` magic).

### Viewport state

| Property      | Type                          | Description                                                          |
| ------------- | ----------------------------- | -------------------------------------------------------------------- |
| `width`       | `number`                      | Current `window.innerWidth`                                          |
| `height`      | `number`                      | Current `window.innerHeight`                                         |
| `breakpoint`  | `Name`                        | Current interval name (resolved via `matchMedia`)                    |
| `intervals`   | `readonly MediaInterval<Name>[]` | The configured intervals array                                      |
| `isMobile`    | `boolean`                     | Shorthand for `is('mobile')`                                         |
| `isTablet`    | `boolean`                     | Shorthand for `is('tablet')`                                         |
| `isDesktop`   | `boolean`                     | Shorthand for `is('desktop')`                                        |
| `is(name)`    | `boolean`                     | Whether `breakpoint === name`                                        |
| `snapshot()`  | `MediaSnapshot`               | Read-only `{ width, height, breakpoint }`                            |

### Media features

| Property             | Type                                                  | Description                                          |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `prefersReducedMotion` | `boolean`                                           | `(prefers-reduced-motion: reduce)`                  |
| `prefersContrast`    | `'no-preference' \| 'more' \| 'less' \| 'custom'`     | User contrast preference                             |
| `prefersColorScheme` | `'light' \| 'dark'`                                   | OS color scheme from `matchMedia` (read-only)       |
| `hover`              | `'none' \| 'hover'`                                   | Primary input hover capability                       |
| `pointer`            | `'none' \| 'coarse' \| 'fine'`                        | Primary pointing device                              |
| `orientation`        | `'portrait' \| 'landscape'`                           | Viewport orientation                                 |
| `maxTouchPoints`     | `number`                                              | `navigator.maxTouchPoints`                           |
| `isTouch`            | `boolean`                                             | Touch device heuristic                               |
| `isCoarse`           | `boolean`                                             | Shorthand for `pointer === 'coarse'`                |
| `isFine`             | `boolean`                                             | Shorthand for `pointer === 'fine'`                  |
| `canHover`           | `boolean`                                             | Shorthand for `hover === 'hover'`                   |

See [Device detection](../device-detection.md) for how `media` and `platform` relate.

### Methods

| Method                | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `snapshot()`          | Read-only `{ width, height, breakpoint }` snapshot                           |
| `refresh()`           | Update all values, returns `true` if changed                                 |
| `refreshWidth()`      | Update width only, returns `true` if changed                                 |
| `refreshHeight()`     | Update height only, returns `true` if changed                                |

### Events

```ts
import { mediaPlugin, createMedia, type MediaChangeDetail } from "@ailuracode/alpine-media";

Alpine.plugin(mediaPlugin());
// or, standalone:
const media = createMedia();

media.on("change", (detail: MediaChangeDetail) => {
  // detail: { current, previous, source: 'initialization' | 'viewport' | 'user' }
  console.log(detail.current.breakpoint, detail.source);
});
```

### Lifecycle

| Property / Method | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| `id`              | Stable identifier (auto-generated when omitted)                          |
| `isDestroyed`     | Whether `destroy()` has run                                               |
| `destroy()`       | Idempotent — releases every listener                                      |

## HTML examples

```html
<span x-show="$store.media.breakpoint === 'mobile'">Mobile nav</span>
<span x-show="$store.media.breakpoint === 'desktop'">Desktop nav</span>

<p>Width: <span x-text="$store.media.width"></span>px</p>
<p>Breakpoint: <span x-text="$store.media.breakpoint"></span></p>
<p x-show="$store.media.prefersReducedMotion">Reduced motion preferred</p>
```

## Theme vs media color scheme

`prefersColorScheme` reports the **operating system** preference from `(prefers-color-scheme: dark)`. It does not reflect a manual theme override in your app.

For **app styling**, use [`@ailuracode/alpine-theme`](./theme.md) and read `$store.theme.resolved`. That value accounts for user choice (`light`, `dark`, or follow system via `current === 'system'`).

| Question                              | Use                              |
| ------------------------------------- | -------------------------------- |
| What theme should the app render?     | `$store.theme.resolved`          |
| What does the OS prefer right now?    | `$store.media.prefersColorScheme` |

```html
<!-- Apply styles -->
<div :class="{ 'dark-ui': $store.theme.resolved === 'dark' }">…</div>

<!-- OS signal (e.g. when user chose "system") -->
<p x-show="$store.theme.current === 'system'">
  Following system: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

See [Theme — `resolved` vs `prefersColorScheme`](./theme.md#resolved-vs-preferscolorscheme) for the full comparison.

## Exported helpers

```ts
import {
  DEFAULT_MEDIA_INTERVALS,
  DEFAULT_MEDIA_DEBOUNCE_MS,
  mediaIntervals,
  resolveMediaBreakpoint,
  SSR_MEDIA_DEFAULTS,
  createMedia,
  createMediaStore,
  MediaController,
  mediaPlugin,
} from "@ailuracode/alpine-media";
```

| Helper                       | Description                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `mediaIntervals(intervals)`  | Asserts literal types (`as const`) on an intervals array                      |
| `resolveMediaBreakpoint(w, i)` | Pure: resolves which interval a width belongs to                            |
| `DEFAULT_MEDIA_INTERVALS`    | Default `mobile` / `desktop` intervals                                       |
| `DEFAULT_MEDIA_DEBOUNCE_MS`  | Default resize debounce window (100 ms)                                      |
| `SSR_MEDIA_DEFAULTS`         | Safe defaults when `window` is unavailable                                   |
| `createMedia(options)`       | Factory: builds + mounts a `MediaController`                                 |
| `createMediaStore(ctrl)`     | Builds a `MediaStore` reactive mirror from a controller                      |
| `MediaController`            | Headless controller class (extends `BaseController` from core)               |
| `mediaPlugin(options)`       | Alpine plugin factory — wires the controller into `$store.media` / `$media`   |

## SSR

The plugin does not throw when `window` is undefined. Width and height default to `0`; media features use conservative defaults (`prefersColorScheme: 'light'`, `pointer: 'fine'`, etc.). The controller still mounts — it simply skips the `matchMedia` / `resize` subscriptions and emits no events.

## Performance

- Breakpoint and media features update via `matchMedia` `change` events (with `addListener` fallback).
- Width and height update on `resize`, debounced (default 100 ms, configurable via `debounceMs`).

## See also

- [Getting started](../getting-started.md)
- [Theme](./theme.md) — companion store; `$store.theme.resolved` for the applied theme
- [Device detection](../device-detection.md)