---
title: "Scroll"
description: "Posición, dirección, progreso y bloqueo de scroll con $store.scroll."
---

Package: `@ailuracode/alpinejs-scroll`

Rastrea posición de desplazamiento, dirección y progreso. Proporciona bloqueo de scroll del body con conteo de referencias para modales y overlays.

## Instalación

```bash
npm install @ailuracode/alpinejs-scroll alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import scroll from "@ailuracode/alpinejs-scroll";

Alpine.plugin(scroll());
Alpine.start();
```

El bloqueo de scroll aplica estilos inline en `html` y `body` (overflow hidden, body fixed). No se requieren clases CSS ni estilos de framework.

### Callback de bloqueo opcional

Añade tus propias clases o atributos cuando cambie el estado de bloqueo:

```js
Alpine.plugin(
  scroll({
    onLockChange(locked) {
      document.documentElement.toggleAttribute("data-scroll-locked", locked);
    },
  }),
);
```

## Helpers exportados

```js
import {
  SCROLL_DIRECTIONS,
  computeScrollDirection,
  computeScrollMetrics,
  readScrollSnapshot,
  scrollOptions,
} from "@ailuracode/alpinejs-scroll";
```

## Store API

Store name: `$store.scroll`

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `x` | `number` | Desplazamiento horizontal |
| `y` | `number` | Desplazamiento vertical |
| `direction` | `ScrollDirection` | `up`, `down` o `none` |
| `progress` | `number` | Progreso de desplazamiento `0–100` |
| `atTop` | `boolean` | En la parte superior de la página |
| `atBottom` | `boolean` | En la parte inferior de la página |
| `locked` | `boolean` | Scroll del body bloqueado |

### Getters

| Getter | Descripción |
|--------|-------------|
| `isLocked` | Igual que `locked` |
| `isAtTop` | Igual que `atTop` |
| `isAtBottom` | Igual que `atBottom` |
| `isScrollingDown` | `direction === 'down'` |
| `isScrollingUp` | `direction === 'up'` |
| `showToTop` | Desplazado hacia abajo y no bloqueado — ideal para botones volver arriba |

### Métodos

| Método | Descripción |
|--------|-------------|
| `lock()` | Bloquea el scroll del body (con conteo de referencias) |
| `unlock()` | Libera un bloqueo |
| `toggleLock()` | Alterna el estado de bloqueo |
| `isDirection(direction)` | Comprueba la dirección actual (`ScrollDirection`) |
| `toTop(behavior?)` | Desplaza al inicio (`behavior` predeterminado: `'smooth'`) |
| `toBottom(behavior?)` | Desplaza al final |
| `refresh()` | Actualiza manualmente las métricas |

## Ejemplos HTML

### Barra de progreso

```html
<div
  class="scroll-progress"
  :style="`width: ${$store.scroll.progress}%`"
></div>
```

### Volver arriba

```html
<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  ↑ Top
</button>
```

### Modal con bloqueo de scroll

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

## Conteo de referencias

Varios componentes pueden llamar a `lock()` de forma independiente. El scroll se restaura solo cuando todos los bloqueos se liberan mediante `unlock()`. Seguro para modales anidados.

## Comportamiento mientras está bloqueado

- Las métricas de scroll pausan las actualizaciones mientras está bloqueado
- `toTop()` / `toBottom()` no hacen nada mientras está bloqueado
