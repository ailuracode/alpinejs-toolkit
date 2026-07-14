---
title: "Media"
description: "Breakpoints e media features do viewport com $store.media."
---

Package: `@ailuracode/alpine-media`

Reactive viewport breakpoints, dimensions, and browser media features in a single Alpine store. Uses `matchMedia` for breakpoint and feature detection and debounced `resize` updates for width and height.

## Instalação

```bash
pnpm install @ailuracode/alpine-media alpinejs
```

## Configuração

```ts
import Alpine from "alpinejs";
import { mediaPlugin } from "@ailuracode/alpine-media";

Alpine.plugin(mediaPlugin());
Alpine.start();
```

## Intervalos padrão

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

## API do store

Nome do store: `$store.media`

### Estado do viewport

| Property      | Type                              | Description                                            |
| ------------- | --------------------------------- | ------------------------------------------------------ |
| `width`       | `number`                          | Current `window.innerWidth`                            |
| `height`      | `number`                          | Current `window.innerHeight`                           |
| `breakpoint`  | `Name`                            | Current interval name (resolved via `matchMedia`)      |
| `intervals`   | `readonly MediaInterval<Name>[]`  | The configured intervals array                         |
| `snapshot()`  | `MediaSnapshot`                   | Read-only `{ width, height, breakpoint }`              |

### Media features

| Property               | Type                                              | Description                                                                |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `prefersReducedMotion` | `boolean`                                         | `(prefers-reduced-motion: reduce)`                                         |
| `prefersContrast`      | `'no-preference' \| 'more' \| 'less' \| 'custom'` | User contrast preference                                                   |
| `prefersColorScheme`   | `'light' \| 'dark'`                               | Esquema de cor do SO via `matchMedia` (somente leitura)                    |
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
// ou standalone:
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

## Exemplos HTML

```html
<span x-show="$store.media.isMobile">Mobile nav</span>
<span x-show="$store.media.isDesktop">Desktop nav</span>

<p>Width: <span x-text="$store.media.width"></span>px</p>
<p>Breakpoint: <span x-text="$store.media.breakpoint"></span></p>
<p x-show="$store.media.prefersReducedMotion">Reduced motion preferred</p>
```

## Tema vs esquema de cor do SO {#theme-vs-media-color-scheme}

`prefersColorScheme` reporta a preferência do **sistema operacional** a partir de `(prefers-color-scheme: dark)`. Não reflete um override manual do tema no seu app.

Para **estilizar o app**, use [`@ailuracode/alpine-theme`](/plugins/theme/) e leia `$store.theme.resolved`. Esse valor considera a escolha do usuário (`light`, `dark`, ou seguir o sistema com `mode: 'system'`).

| Pergunta | Usar |
|----------|------|
| Qual tema o app deve renderizar? | `$store.theme.resolved` |
| O que o SO prefere agora? | `$store.media.prefersColorScheme` |

```html
<!-- Aplicar estilos -->
<div :class="{ 'dark-ui': $store.theme.isResolvedDark }">...</div>

<!-- Sinal do SO (ex.: quando o usuário escolheu "system") -->
<p x-show="$store.theme.isSystem">
  Seguindo sistema: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

Ver [Theme — `resolved` vs `prefersColorScheme`](/plugins/theme/#resolved-vs-preferscolorscheme) para a comparação completa.

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

## Desempenho

- Breakpoint and media features update via `matchMedia` `change` events (with `addListener` fallback)
- **Width** and **height** update on `resize`, debounced (default 100 ms, configurável via `debounceMs`)
