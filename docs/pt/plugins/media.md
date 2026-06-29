---
title: "Media"
description: "Breakpoints e media features do viewport com $store.media."
---

Package: `@ailuracode/alpine-media`

Reactive viewport breakpoints, dimensions, and browser media features in a single Alpine store. Uses `matchMedia` for breakpoint and feature detection and debounced `resize` updates for width and height.

## Instalação

```bash
npm install @ailuracode/alpine-media alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import media from "@ailuracode/alpine-media";

Alpine.plugin(media());
Alpine.start();
```

## Intervalos padrão

| Name | Range |
|------|-------|
| Mobile | ≤ 767px |
| Desktop | ≥ 768px |

## Intervalos personalizados

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

## API do store

Nome do store: `$store.media`

### Estado do viewport

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
| `prefersColorScheme` | `'light' \| 'dark'` | Esquema de cor do SO via `matchMedia` (somente leitura; ver [Theme](./theme.md#resolved-vs-preferscolorscheme) para `resolved`) |
| `hover` | `'none' \| 'hover'` | Primary input hover capability |
| `pointer` | `'none' \| 'coarse' \| 'fine'` | Primary pointing device |
| `orientation` | `'portrait' \| 'landscape'` | Viewport orientation |

### Métodos

| Method | Description |
|--------|-------------|
| `is(name)` | Check if current breakpoint matches: `is('mobile')` |
| `refresh()` | Update all values, returns `true` if changed |
| `refreshWidth()` | Update width only, returns `true` if changed |
| `refreshHeight()` | Update height only, returns `true` if changed |

## Exemplos HTML

```html
<span x-show="$store.media.isMobile">Mobile nav</span>
<span x-show="$store.media.isDesktop">Desktop nav</span>

<p>Width: <span x-text="$store.media.width"></span>px</p>
<p>Breakpoint: <span x-text="$store.media.breakpoint"></span></p>
<p x-show="$store.media.prefersReducedMotion">Reduced motion preferred</p>
```

## Tema vs esquema de cor do SO

`prefersColorScheme` reporta a preferência do **sistema operacional** a partir de `(prefers-color-scheme: dark)`. Não reflete um override manual do tema no seu app.

Para **estilizar o app**, use [`@ailuracode/alpine-theme`](./theme.md) e leia `$store.theme.resolved`. Esse valor considera a escolha do usuário (`light`, `dark`, ou seguir o sistema com `mode: 'system'`).

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

Ver [Theme — `resolved` vs `prefersColorScheme`](./theme.md#resolved-vs-preferscolorscheme) para a comparação completa.

## Helpers exportados

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

## Desempenho

- Breakpoint and media features update via `matchMedia` `change` events (with `addListener` fallback)
- **Width** and **height** update on `resize`, debounced to 100 ms
