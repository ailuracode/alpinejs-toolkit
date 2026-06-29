---
title: "Media"
description: "Package: @ailuracode/alpine-media"
---

Package: `@ailuracode/alpine-media`

Reactive viewport breakpoints, dimensions, and browser media features in a single Alpine store. Uses `matchMedia` for breakpoint and feature detection and debounced `resize` updates for width and height.

## Install

```bash
npm install @ailuracode/alpine-media alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import media from "@ailuracode/alpine-media";

Alpine.plugin(media());
Alpine.start();
```

## Default intervals

| Name | Range |
|------|-------|
| Mobile | ≤ 767px |
| Desktop | ≥ 768px |

## Custom intervals

You can define arbitrary interval names and breakpoints. Intervals are checked **smallest-first** — the first interval whose `maxWidth >= window.innerWidth` wins.

```js
import Alpine from "alpinejs";
import media from "@ailuracode/alpine-media";

Alpine.plugin(media({
  intervals: [
    { name: "phone", maxWidth: 480 },
    { name: "tablet", maxWidth: 768 },
    { name: "desktop", maxWidth: Infinity },
  ],
}));
Alpine.start();
```

For full TypeScript inference of interval names, use `as const`:

```js
Alpine.plugin(media({
  intervals: [
    { name: "phone", maxWidth: 480 },
    { name: "tablet", maxWidth: 768 },
    { name: "desktop", maxWidth: Infinity },
  ] as const,
}));
// $store.media.breakpoint is "phone" | "tablet" | "desktop"
```

## Store API

Store name: `$store.media`

### Viewport state

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Current `window.innerWidth` |
| `height` | `number` | Current `window.innerHeight` |
| `breakpoint` | `Name` | Current interval name (resolved via `matchMedia`) |
| `intervals` | `readonly MediaInterval<Name>[]` | The configured intervals array |
| `isMobile` | `boolean` | Shorthand for `is('mobile')` |
| `isTablet` | `boolean` | Shorthand for `is('tablet')` |
| `isDesktop` | `boolean` | Shorthand for `is('desktop')` |

### Media features

| Property | Type | Description |
|----------|------|-------------|
| `prefersReducedMotion` | `boolean` | `(prefers-reduced-motion: reduce)` |
| `prefersContrast` | `'no-preference' \| 'more' \| 'less' \| 'custom'` | User contrast preference |
| `prefersColorScheme` | `'light' \| 'dark'` | OS color scheme from `matchMedia` (read-only; see [Theme](./theme.md#resolved-vs-preferscolorscheme) for `resolved`) |
| `hover` | `'none' \| 'hover'` | Primary input hover capability |
| `pointer` | `'none' \| 'coarse' \| 'fine'` | Primary pointing device |
| `orientation` | `'portrait' \| 'landscape'` | Viewport orientation |
| `maxTouchPoints` | `number` | `navigator.maxTouchPoints` |
| `isTouch` | `boolean` | Touch device heuristic (coarse pointer, touch points, or `ontouchstart`) |
| `isCoarse` | `boolean` | Shorthand for `pointer === 'coarse'` |
| `isFine` | `boolean` | Shorthand for `pointer === 'fine'` |
| `canHover` | `boolean` | Shorthand for `hover === 'hover'` |

See [Device detection](../device-detection.md) for how `media` and `platform` relate.

### Methods

| Method | Description |
|--------|-------------|
| `is(name)` | Check if current breakpoint matches: `is('mobile')` |
| `refresh()` | Update all values, returns `true` if changed |
| `refreshWidth()` | Update width only, returns `true` if changed |
| `refreshHeight()` | Update height only, returns `true` if changed |

## HTML examples

```html
<span x-show="$store.media.isMobile">Mobile nav</span>
<span x-show="$store.media.isDesktop">Desktop nav</span>

<p>Width: <span x-text="$store.media.width"></span>px</p>
<p>Breakpoint: <span x-text="$store.media.breakpoint"></span></p>
<p x-show="$store.media.prefersReducedMotion">Reduced motion preferred</p>
```

## Theme vs media color scheme

`prefersColorScheme` reports the **operating system** preference from `(prefers-color-scheme: dark)`. It does not reflect a manual theme override in your app.

For **app styling**, use [`@ailuracode/alpine-theme`](./theme.md) and read `$store.theme.resolved`. That value accounts for user choice (`light`, `dark`, or follow system via `mode: 'system'`).

| Question | Use |
|----------|-----|
| What theme should the app render? | `$store.theme.resolved` |
| What does the OS prefer right now? | `$store.media.prefersColorScheme` |

```html
<!-- Apply styles -->
<div :class="{ 'dark-ui': $store.theme.isResolvedDark }">...</div>

<!-- OS signal (e.g. when user chose "system") -->
<p x-show="$store.theme.isSystem">
  Following system: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

See [Theme — `resolved` vs `prefersColorScheme`](./theme.md#resolved-vs-preferscolorscheme) for the full comparison.

## Exported helpers

```js
import {
  DEFAULT_MEDIA_INTERVALS,
  mediaIntervals,
  readMediaSnapshot,
  resolveMediaBreakpoint,
  SSR_MEDIA_DEFAULTS,
} from "@ailuracode/alpine-media";
```

| Helper | Description |
|--------|-------------|
| `mediaIntervals(intervals)` | Asserts literal types (`as const`) on an intervals array |
| `resolveMediaBreakpoint(width, intervals)` | Pure: resolves which interval a width belongs to |
| `readMediaSnapshot(intervals?)` | Reads a snapshot from current viewport dimensions |
| `SSR_MEDIA_DEFAULTS` | Safe defaults when `window` is unavailable |

## SSR

The plugin does not throw when `window` is undefined. Width and height default to `0`; media features use conservative defaults (`prefersColorScheme: 'light'`, `pointer: 'fine'`, etc.).

## Performance

- Breakpoint and media features update via `matchMedia` `change` events (with `addListener` fallback)
- **Width** and **height** update on `resize`, debounced to 100 ms
