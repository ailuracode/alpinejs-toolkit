---
title: "Scroll"
description: "Package: @ailuracode/alpine-scroll"
---

Package: `@ailuracode/alpine-scroll`

Tracks scroll position, direction, and progress. Provides reference-counted body scroll lock for modals and overlays.

## Install

```bash
npm install @ailuracode/alpine-scroll alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import scroll from "@ailuracode/alpine-scroll";

Alpine.plugin(scroll());
Alpine.start();
```

Scroll lock applies inline styles on `html` and `body`. No CSS classes or framework styles are required.

- **`lock()` / `lock({ axis: 'y' })`** (default) — blocks vertical page scroll via `overflow-y: hidden`. Horizontal scroll stays available; unlock preserves the current horizontal offset.
- **`lock({ axis: 'both' })`** — full page freeze with a fixed `body` (modals on pages with horizontal overflow). Saves and restores both axes.

### Optional lock callback

Add your own classes or attributes when lock state changes:

```js
Alpine.plugin(
  scroll({
    onLockChange(locked) {
      document.documentElement.toggleAttribute("data-scroll-locked", locked);
    },
  }),
);
```

## Exported helpers

```js
import {
  SCROLL_DIRECTIONS,
  computeScrollDirection,
  computeScrollMetrics,
  readScrollSnapshot,
  scrollOptions,
} from "@ailuracode/alpine-scroll";
```

## Store API

Store name: `$store.scroll`

### State

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | Horizontal scroll offset |
| `y` | `number` | Vertical scroll offset |
| `direction` | `ScrollDirection` | `up`, `down`, or `none` |
| `progress` | `number` | Scroll progress `0–100` |
| `atTop` | `boolean` | At top of page |
| `atBottom` | `boolean` | At bottom of page |
| `locked` | `boolean` | Body scroll locked |

### Getters

| Getter | Description |
|--------|-------------|
| `isLocked` | Same as `locked` |
| `isAtTop` | Same as `atTop` |
| `isAtBottom` | Same as `atBottom` |
| `isScrollingDown` | `direction === 'down'` |
| `isScrollingUp` | `direction === 'up'` |
| `showToTop` | Scrolled down and not locked — ideal for back-to-top buttons |

### Methods

| Method | Description |
|--------|-------------|
| `lock(options?)` | Lock page scroll. `options.axis`: `'y'` (default) or `'both'` |
| `unlock()` | Release one lock |
| `toggleLock(options?)` | Toggle lock state |
| `isDirection(direction)` | Check current direction (`ScrollDirection`) |
| `toTop(behavior?)` | Scroll to top (`behavior` default: `'smooth'`) |
| `toBottom(behavior?)` | Scroll to bottom |
| `refresh()` | Manually refresh metrics |

## HTML examples

### Progress bar

```html
<div
  class="scroll-progress"
  :style="`width: ${$store.scroll.progress}%`"
></div>
```

### Back to top

```html
<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  ↑ Top
</button>
```

### Modal with scroll lock

```html
<div x-data="{ open: false }">
  <button @click="open = true; $store.scroll.lock()">Open modal</button>

  <div x-show="open" @keydown.escape.window="open = false; $store.scroll.unlock()">
    <div @click.outside="open = false; $store.scroll.unlock()">
      <p>Modal content</p>
      <button @click="open = false; $store.scroll.unlock()">Close</button>
    </div>
  </div>
</div>
```

### Horizontal page overflow

When the page scrolls horizontally (wide tables, carousels), freeze both axes:

```html
<button @click="$store.scroll.lock({ axis: 'both' })">Open overlay</button>
```

## Reference counting

Multiple components can call `lock()` independently. Scroll is restored only when all locks are released via `unlock()`. Safe for nested modals.

## Behavior while locked

- Scroll metrics pause updates while locked
- `toTop()` / `toBottom()` are no-ops while locked
