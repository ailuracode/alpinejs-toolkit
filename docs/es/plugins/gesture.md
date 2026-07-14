---
title: "Gesture"
description: "Reconocimiento headless de gestos con tap, swipe, pan, pinch y la directiva x-gesture."
---

Package: `@ailuracode/alpine-gesture`

Reconocimiento headless de gestos para Alpine.js — tap, swipe, pan, pinch y long press mediante eventos de puntero.

**Agnóstico al framework CSS** — sin markup ni estilos. El controller reconoce gestos y emite eventos estructurados; tú conectas tu propia UI.

## Instalación

```bash
pnpm add @ailuracode/alpine-gesture alpinejs
```

## Ejemplo rápido

```ts
import Alpine from "alpinejs";
import { gesturePlugin } from "@ailuracode/alpine-gesture";

Alpine.plugin(gesturePlugin());
```

```html
<div x-data="{ handleSwipe(e) { console.log(e.direction) } }">
  <div class="box" x-gesture:swipe="handleSwipe">Swipe me</div>
</div>
```

## Gestos reconocidos

| Gesto | Eventos | Notas |
|-------|---------|-------|
| **tap** | `tap` | Pulsación corta bajo 300 ms |
| **doubletap** | `doubletap` | Dos taps dentro de `doubleTapInterval` |
| **longpress** | `longpress` | Mantenido durante `longPressDelay` ms |
| **swipe** | `swipe` | Liberación rápida superando `swipeThreshold` |
| **pan** | `pan` (start / move / end) | Arrastre superando `panThreshold` |
| **pinch** | `pinch` (start / move / end) | Separación o pellizco con dos punteros |

## Gestos en competencia

Cuando varios reconocedores están activos el controller cancela los perdedores:

- Pan supera el umbral → longpress y swipe se cancelan.
- Swipe se libera → pan se cancela.
- El temporizador de longpress se dispara → tap y swipe se cancelan.

## Opciones del plugin

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `mouseButtons` | `[0]` | Botones del ratón que pueden iniciar reconocimiento (`0` = izquierdo, `2` = derecho). Touch siempre usa `0`. |

## API headless

```ts
import { GestureController } from "@ailuracode/alpine-gesture";

const ctrl = new GestureController({
  gestures: ["swipe", "pan"],
  panThreshold: 10,
  swipeThreshold: 30,
});

ctrl.attach(document.getElementById("surface"));
ctrl.mount();

ctrl.on("swipe", (detail) => console.log(detail.direction));
ctrl.on("pan", (detail) => {
  if (detail.phase === "move") drawGuide(detail.distanceX, detail.distanceY);
});

// más tarde
ctrl.destroy();
```

## Integración con Alpine

### Store (`$store.gesture`)

Snapshot reactivo del evento de gesto más reciente, actualizado en cada gesto reconocido.

### Magic (`$gesture`)

Devuelve el objeto de estado de gesto actual.

### Directiva (`x-gesture`)

```html
<div x-data="{ onPan(e) { /* … */ } }">
  <div x-gesture:pan="onPan">Drag me</div>
</div>
```

### Zoom con pinch

```html
<div
  x-data="{
    zoom: 1,
    baseZoom: 1,
    onPinch(d) {
      const scale = d.state?.scale ?? d.scale ?? 1;
      this.zoom = this.baseZoom * scale;
    },
    commitZoom() { this.baseZoom = this.zoom }
  }"
>
  <div x-gesture:pinch="onPinch" @pointerup="commitZoom()" style="touch-action: none;">
    <div :style="'transform: scale(' + zoom + ')'">Pinch me</div>
  </div>
</div>
```

## Ver también

- [Primeros pasos](../getting-started.md)
