---
title: "Screen"
description: "Package: @ailuracode/alpinejs-screen"
---

Package: `@ailuracode/alpinejs-screen`

Responsive device detection and live viewport width. Uses `matchMedia` for device type detection and debounced `resize` updates for width.

## Install

```bash
npm install @ailuracode/alpinejs-screen alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(screen());
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
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(screen({
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
Alpine.plugin(screen({
  intervals: [
    { name: "phone", maxWidth: 480 },
    { name: "tablet", maxWidth: 768 },
    { name: "desktop", maxWidth: Infinity },
  ] as const,
}));
// $store.device.type is "phone" | "tablet" | "desktop"
```

## Store API

Store name: `$store.device`

### State

| Property | Type | Description |
|----------|------|-------------|
| `type` | `Name` | Current interval name (resolved via `matchMedia`) |
| `width` | `number` | Current `window.innerWidth` |
| `intervals` | `readonly ScreenInterval<Name>[]` | The configured intervals array |

### Methods

| Method | Description |
|--------|-------------|
| `is(name)` | Check if current type matches: `is('mobile')` |
| `refresh()` | Update type and width, returns `true` if changed |
| `refreshWidth()` | Update width only, returns `true` if changed |

## HTML examples

```html
<span x-show="$store.device.is('mobile')">Mobile nav</span>
<span x-show="$store.device.is('desktop')">Desktop nav</span>

<p>Width: <span x-text="$store.device.width"></span>px</p>
<p>Device: <span x-text="$store.device.type"></span></p>
```

## Exported helpers

```js
import {
  DEFAULT_SCREEN_INTERVALS,
  screenIntervals,
  readScreenSnapshot,
  resolveScreenType,
} from "@ailuracode/alpinejs-screen";
```

| Helper | Description |
|--------|-------------|
| `screenIntervals(intervals)` | Asserts literal types (`as const`) on an intervals array |
| `resolveScreenType(width, intervals)` | Pure: resolves which interval a width belongs to |
| `readScreenSnapshot(intervals?)` | Reads a snapshot from current `window.innerWidth` |

## Performance

- Device **type** updates via `matchMedia` `change` events (no resize polling)
- **Width** updates on `resize`, debounced to 100 ms
