---
title: "Screen"
description: "Breakpoints y dimensiones del viewport con $store.device."
---

Package: `@ailuracode/alpinejs-screen`

Detección reactiva de dispositivo y ancho de viewport en vivo. Usa `matchMedia` para detectar el tipo de dispositivo y actualizaciones de `resize` con debounce para el ancho.

## Instalación

```bash
npm install @ailuracode/alpinejs-screen alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(screen());
Alpine.start();
```

## Intervalos predeterminados

| Nombre | Rango |
|------|-------|
| Mobile | ≤ 767px |
| Desktop | ≥ 768px |

## Intervalos personalizados

Puedes definir nombres de intervalo y breakpoints arbitrarios. Los intervalos se comprueban **de menor a mayor** — gana el primer intervalo cuyo `maxWidth >= window.innerWidth`.

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

Para inferencia completa de TypeScript de los nombres de intervalo, usa `as const`:

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

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `type` | `Name` | Nombre del intervalo actual (resuelto mediante `matchMedia`) |
| `width` | `number` | `window.innerWidth` actual |
| `intervals` | `readonly ScreenInterval<Name>[]` | Array de intervalos configurados |

### Métodos

| Método | Descripción |
|--------|-------------|
| `is(name)` | Comprueba si el tipo actual coincide: `is('mobile')` |
| `refresh()` | Actualiza tipo y ancho, devuelve `true` si cambió |
| `refreshWidth()` | Actualiza solo el ancho, devuelve `true` si cambió |

## Ejemplos HTML

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

| Helper | Descripción |
|--------|-------------|
| `screenIntervals(intervals)` | Afirma tipos literales (`as const`) en un array de intervalos |
| `resolveScreenType(width, intervals)` | Puro: resuelve a qué intervalo pertenece un ancho |
| `readScreenSnapshot(intervals?)` | Lee una instantánea del `window.innerWidth` actual |

## Rendimiento

- El **tipo** de dispositivo se actualiza mediante eventos `change` de `matchMedia` (sin polling de resize)
- El **ancho** se actualiza en `resize`, con debounce de 100 ms
