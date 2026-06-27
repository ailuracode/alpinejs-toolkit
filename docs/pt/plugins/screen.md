---
title: "Screen"
description: "Breakpoints e dimensões do viewport com $store.device."
---

Package: `@ailuracode/alpinejs-screen`

Detecção responsiva de dispositivo e largura do viewport em tempo real. Usa `matchMedia` para detecção de tipo de dispositivo e atualizações de largura com debounce em `resize`.

## Instalação

```bash
npm install @ailuracode/alpinejs-screen alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(screen());
Alpine.start();
```

## Intervalos padrão

| Nome | Faixa |
|------|-------|
| Mobile | ≤ 767px |
| Desktop | ≥ 768px |

## Intervalos personalizados

Você pode definir nomes de intervalo e breakpoints arbitrários. Os intervalos são verificados **do menor para o maior** — o primeiro intervalo cujo `maxWidth >= window.innerWidth` prevalece.

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

Para inferência TypeScript completa dos nomes de intervalo, use `as const`:

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

### Estado

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `type` | `Name` | Nome do intervalo atual (resolvido via `matchMedia`) |
| `width` | `number` | `window.innerWidth` atual |
| `intervals` | `readonly ScreenInterval<Name>[]` | Array de intervalos configurados |

### Métodos

| Método | Descrição |
|--------|-------------|
| `is(name)` | Verifica se o tipo atual corresponde: `is('mobile')` |
| `refresh()` | Atualiza tipo e largura, retorna `true` se mudou |
| `refreshWidth()` | Atualiza apenas a largura, retorna `true` se mudou |

## Exemplos HTML

```html
<span x-show="$store.device.is('mobile')">Mobile nav</span>
<span x-show="$store.device.is('desktop')">Desktop nav</span>

<p>Width: <span x-text="$store.device.width"></span>px</p>
<p>Device: <span x-text="$store.device.type"></span></p>
```

## Helpers exportados

```js
import {
  DEFAULT_SCREEN_INTERVALS,
  screenIntervals,
  readScreenSnapshot,
  resolveScreenType,
} from "@ailuracode/alpinejs-screen";
```

| Helper | Descrição |
|--------|-------------|
| `screenIntervals(intervals)` | Afirma tipos literais (`as const`) em um array de intervalos |
| `resolveScreenType(width, intervals)` | Puro: resolve a qual intervalo uma largura pertence |
| `readScreenSnapshot(intervals?)` | Lê um snapshot do `window.innerWidth` atual |

## Desempenho

- O **tipo** de dispositivo atualiza via eventos `change` de `matchMedia` (sem polling de resize)
- A **largura** atualiza em `resize`, com debounce de 100 ms
