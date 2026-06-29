# @ailuracode/alpine-media

Alpine.js plugin — reactive viewport breakpoints, dimensions, and browser media features in a single store.

## Install

```bash
npm install @ailuracode/alpine-media alpinejs
```

## Usage

```js
import Alpine from "alpinejs";
import media from "@ailuracode/alpine-media";

Alpine.plugin(media());
Alpine.start();
```

```html
<nav x-show="$store.media.isMobile">Mobile menu</nav>
<p>Breakpoint: <span x-text="$store.media.breakpoint"></span></p>
<p x-show="$store.media.prefersReducedMotion">Reduced motion preferred</p>
```

## Default intervals

| Name | Range |
|------|-------|
| Mobile | ≤ 767px |
| Desktop | ≥ 768px |

## Custom intervals

```js
Alpine.plugin(media({
  intervals: [
    { name: "phone", maxWidth: 480 },
    { name: "tablet", maxWidth: 768 },
    { name: "desktop", maxWidth: Infinity },
  ] as const,
}));
```

## Store API

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | `window.innerWidth` |
| `height` | `number` | `window.innerHeight` |
| `breakpoint` | `Name` | Current interval name |
| `isMobile` | `boolean` | Shorthand for `is('mobile')` |
| `isTablet` | `boolean` | Shorthand for `is('tablet')` |
| `isDesktop` | `boolean` | Shorthand for `is('desktop')` |
| `prefersReducedMotion` | `boolean` | `(prefers-reduced-motion: reduce)` |
| `prefersContrast` | `'no-preference' \| 'more' \| 'less' \| 'custom'` | User contrast preference |
| `prefersColorScheme` | `'light' \| 'dark'` | OS color scheme (read-only) |
| `hover` | `'none' \| 'hover'` | Primary input hover capability |
| `pointer` | `'none' \| 'coarse' \| 'fine'` | Primary pointing device |
| `orientation` | `'portrait' \| 'landscape'` | Viewport orientation |
| `maxTouchPoints` | `number` | `navigator.maxTouchPoints` |
| `isTouch` | `boolean` | Touch device heuristic |
| `isCoarse` | `boolean` | `pointer === 'coarse'` |
| `isFine` | `boolean` | `pointer === 'fine'` |
| `canHover` | `boolean` | `hover === 'hover'` |

**vs theme:** use `$store.theme.resolved` to style the app; use `prefersColorScheme` for the OS signal only. [Full comparison →](../../docs/plugins/media.md#theme-vs-media-color-scheme)

See [Device detection →](../../docs/device-detection.md)

| Method | Description |
|--------|-------------|
| `is(name)` | Check if current breakpoint matches |
| `refresh()` | Update all values, returns `true` if changed |
| `refreshWidth()` | Update width only |
| `refreshHeight()` | Update height only |

| **Store** | `$store.media` |
| **Magic** | `$media` |

## SSR

Safe defaults when `window` is unavailable — width/height `0`, `prefersColorScheme: 'light'`, etc.

## License

MIT
