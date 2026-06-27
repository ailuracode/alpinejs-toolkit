---
title: "Visibility"
description: "Visibilidad de pestaña y Page Visibility con $visibility."
---

Package: `@ailuracode/alpinejs-visibility`

Visibilidad de pestaña reactiva mediante el magic `$visibility`. Envuelve la [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) (`document.visibilityState`, `visibilitychange`).

## Instalación

```bash
npm install @ailuracode/alpinejs-visibility alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import visibility from "@ailuracode/alpinejs-visibility";

Alpine.plugin(visibility);
Alpine.start();
```

## Magic API

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `isVisible` | `boolean` (getter) | `true` cuando la pestaña es visible |
| `isHidden` | `boolean` (getter) | `true` cuando la pestaña está oculta |
| `state` | `VisibilityState` (getter) | `document.visibilityState` sin procesar |
| `is(state)` | `boolean` | `true` cuando `state` coincide con la visibilidad actual |

## Helpers exportados

```js
import {
  VISIBILITY_STATES,
  createVisibilityState,
  readVisibilityState,
} from "@ailuracode/alpinejs-visibility";
```

## Ejemplos HTML

```html
<div x-show="!$visibility.isVisible" class="background-banner">
  This tab is in the background
</div>

<span
  :class="$visibility.isVisible ? 'dot-active' : 'dot-idle'"
  x-text="$visibility.isVisible ? 'Active tab' : 'Background tab'"
></span>

<div x-show="$visibility.is('hidden')">
  Pause animations or polling while hidden
</div>
```

## Notas

- Se dispara cuando el usuario cambia de pestaña, minimiza la ventana o bloquea la pantalla
- Usa `isVisible` para comprobaciones booleanas; usa `state` cuando necesites el valor de visibilidad sin procesar
- Solo lectura — sin store ni persistencia
