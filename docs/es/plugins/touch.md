---
title: "Touch"
description: "Detección de entrada táctil con el magic $touch."
---

Package: `@ailuracode/alpinejs-touch`

Detecta dispositivos táctiles y capacidades del puntero mediante el magic `$touch`. Se actualiza con cambios de `matchMedia`.

## Instalación

```bash
npm install @ailuracode/alpinejs-touch alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import touch from "@ailuracode/alpinejs-touch";

Alpine.plugin(touch);
Alpine.start();
```

## Magic API

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `isTouch` | `boolean` | Dispositivo táctil o puntero coarse |
| `isCoarse` | `boolean` | Coincide `(pointer: coarse)` |
| `isFine` | `boolean` | Coincide `(pointer: fine)` |
| `canHover` | `boolean` | Coincide `(hover: hover)` |
| `maxTouchPoints` | `number` | `navigator.maxTouchPoints` |

`isTouch` es `true` cuando se cumple cualquiera de lo siguiente:

- Puntero coarse (`pointer: coarse`)
- `maxTouchPoints > 0`
- `'ontouchstart' in window`

## Ejemplos HTML

```html
<p x-show="$touch.isTouch">Touch-optimized controls</p>
<p x-show="$touch.canHover">Hover effects enabled</p>

<p>
  Pointer:
  <span x-text="$touch.isCoarse ? 'coarse (touch)' : 'fine (mouse)'"></span>
</p>
```

## Casos de uso

- Mostrar objetivos de toque más grandes en dispositivos táctiles
- Deshabilitar UI solo con hover cuando `!$touch.canHover`
- Ramificar lógica de layout junto con `@ailuracode/alpinejs-screen` para tamaño de viewport

## Notas

- Magic de solo lectura — sin store
- Combina varias señales para detección táctil fiable
- Reacciona a cambios de dispositivo / puntero sin recargar la página
