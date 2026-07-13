---
title: "Media"
description: "Breakpoints y media features del viewport con $store.media."
---

Package: `@ailuracode/alpine-media`

Reactive viewport breakpoints, dimensions, and browser media features in a single Alpine store. Uses `matchMedia` for breakpoint and feature detection and debounced `resize` updates for width and height.

## Instalación

```bash
pnpm install @ailuracode/alpine-media alpinejs
```

## Configuración

```ts
import Alpine from "alpinejs";
import { mediaPlugin } from "@ailuracode/alpine-media";

Alpine.plugin(mediaPlugin());
Alpine.start();
```

## Intervalos predeterminados

| Name | Range |
|------|-------|
| Mobile | ≤ 767px |
| Desktop | ≥ 768px |

## Intervalos personalizados

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

## API del store

Nombre del store: `$store.media`

### Estado del viewport

| Property      | Type                              | Description                                            |
| ------------- | --------------------------------- | ------------------------------------------------------ |
| `width`       | `number`                          | Current `window.innerWidth`                            |
| `height`      | `number`                          | Current `window.innerHeight`                           |
| `breakpoint`  | `Name`                            | Current interval name (resolved via `matchMedia`)      |
| `intervals`   | `readonly MediaInterval<Name>[]`  | The configured intervals array                         |
| `isMobile`    | `boolean`                         | Shorthand for `is('mobile')`                           |
| `isTablet`    | `boolean`                         | Shorthand for `is('tablet')`                           |
| `isDesktop`   | `boolean`                         | Shorthand for `is('desktop')`                          |
| `is(name)`    | `boolean`                         | Whether `breakpoint === name`                          |
| `snapshot()`  | `MediaSnapshot`                   | Read-only `{ width, height, breakpoint }`              |

### Media features

| Property               | Type                                              | Description                                                                |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `prefersReducedMotion` | `boolean`                                         | `(prefers-reduced-motion: reduce)`                                         |
| `prefersContrast`      | `'no-preference' \| 'more' \| 'less' \| 'custom'` | User contrast preference                                                   |
| `prefersColorScheme`   | `'light' \| 'dark'`                               | Esquema de color del SO vía `matchMedia` (solo lectura)                    |
| `hover`                | `'none' \| 'hover'`                               | Primary input hover capability                                             |
| `pointer`              | `'none' \| 'coarse' \| 'fine'`                    | Primary pointing device                                                    |
| `orientation`          | `'portrait' \| 'landscape'`                       | Viewport orientation                                                       |
| `maxTouchPoints`       | `number`                                          | `navigator.maxTouchPoints`                                                 |
| `isTouch`              | `boolean`                                         | Touch device heuristic                                                     |
| `isCoarse`             | `boolean`                                         | Shorthand for `pointer === 'coarse'`                                       |
| `isFine`               | `boolean`                                         | Shorthand for `pointer === 'fine'`                                         |
| `canHover`             | `boolean`                                         | Shorthand for `hover === 'hover'`                                          |

### Métodos

| Method             | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `is(name)`         | Check if current breakpoint matches: `is('mobile')`        |
| `snapshot()`       | Read-only `{ width, height, breakpoint }` snapshot          |
| `refresh()`        | Update all values, returns `true` if changed               |
| `refreshWidth()`   | Update width only, returns `true` if changed               |
| `refreshHeight()`  | Update height only, returns `true` if changed              |

### Eventos

```ts
import { mediaPlugin, createMedia, type MediaChangeDetail } from "@ailuracode/alpine-media";

Alpine.plugin(mediaPlugin());
// o standalone:
const media = createMedia();

media.on("change", (detail: MediaChangeDetail) => {
  // detail: { current, previous, source: 'initialization' | 'viewport' | 'user' }
  console.log(detail.current.breakpoint, detail.source);
});
```

### Lifecycle

| Property / Method | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `id`              | Stable identifier (auto-generated when omitted)          |
| `isDestroyed`     | Whether `destroy()` has run                              |
| `destroy()`       | Idempotent — releases every listener                     |

## Ejemplos HTML

```html
<span x-show="$store.media.breakpoint === 'mobile'">Mobile nav</span>
<span x-show="$store.media.breakpoint === 'desktop'">Desktop nav</span>

<p>Width: <span x-text="$store.media.width"></span>px</p>
<p>Breakpoint: <span x-text="$store.media.breakpoint"></span></p>
<p x-show="$store.media.prefersReducedMotion">Reduced motion preferred</p>
```

## Tema vs esquema de color del SO

`prefersColorScheme` reporta la preferencia del **sistema operativo** desde `(prefers-color-scheme: dark)`. No refleja un override manual del tema en tu app.

Para **estilar la app**, usa [`@ailuracode/alpine-theme`](./theme.md) y lee `$store.theme.resolved`. Ese valor tiene en cuenta la elección del usuario (`light`, `dark`, o seguir el sistema con `mode: 'system'`).

| Pregunta | Usar |
|----------|------|
| ¿Qué tema debe renderizar la app? | `$store.theme.resolved` |
| ¿Qué prefiere el SO ahora? | `$store.media.prefersColorScheme` |

```html
<!-- Aplicar estilos -->
<div :class="{ 'dark-ui': $store.theme.isResolvedDark }">...</div>

<!-- Señal del SO (p. ej. cuando el usuario eligió "system") -->
<p x-show="$store.theme.isSystem">
  Siguiendo sistema: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

Ver [Theme — `resolved` vs `prefersColorScheme`](./theme.md#resolved-vs-preferscolorscheme) para la comparación completa.

## Helpers exportados

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

| Helper                       | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `mediaIntervals(intervals)`  | Asserts literal types (`as const`) on an intervals array                 |
| `resolveMediaBreakpoint(w, i)` | Pure: resolves which interval a width belongs to                        |
| `DEFAULT_MEDIA_INTERVALS`    | Default `mobile` / `desktop` intervals                                   |
| `DEFAULT_MEDIA_DEBOUNCE_MS`  | Default resize debounce window (100 ms)                                  |
| `SSR_MEDIA_DEFAULTS`         | Safe defaults when `window` is unavailable                               |
| `createMedia(options)`       | Factory: builds + mounts a `MediaController`                             |
| `createMediaStore(ctrl)`     | Builds a `MediaStore` reactive mirror from a controller                  |
| `MediaController`            | Headless controller class (extends `BaseController` from core)           |
| `mediaPlugin(options)`       | Alpine plugin factory — wires the controller into `$store.media` / `$media` |

## SSR

The plugin does not throw when `window` is undefined. Width and height default to `0`; media features use conservative defaults (`prefersColorScheme: 'light'`, `pointer: 'fine'`, etc.).

## Rendimiento

- Breakpoint and media features update via `matchMedia` `change` events (with `addListener` fallback)
- **Width** and **height** update on `resize`, debounced (default 100 ms, configurable via `debounceMs`)
