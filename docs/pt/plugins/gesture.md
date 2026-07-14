---
title: "Gesture"
description: "Reconhecimento headless de gestos via pointer events com $store.gesture, $gesture e x-gesture."
---

Package: `@ailuracode/alpine-gesture`

Reconhecimento headless de gestos para Alpine.js — tap, swipe, pan, pinch e long press via pointer events.

**Agnóstico de framework CSS** — sem markup, sem estilos. O controller reconhece gestos e emite eventos estruturados; você conecta sua própria UI.

## Instalação

```bash
pnpm add @ailuracode/alpine-gesture alpinejs
```

## Exemplo rápido

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

## Gestos reconhecidos

| Gesto | Eventos | Notas |
|---------|--------|-------|
| **tap** | `tap` | Pressão curta abaixo de 300 ms |
| **doubletap** | `doubletap` | Dois taps dentro de `doubleTapInterval` |
| **longpress** | `longpress` | Mantido por `longPressDelay` ms |
| **swipe** | `swipe` | Liberação rápida excedendo `swipeThreshold` |
| **pan** | `pan` (start / move / end) | Arrasto excedendo `panThreshold` |
| **pinch** | `pinch` (start / move / end) | Spread ou pinch com dois pointers |

## Gestos competindo

Quando múltiplos reconhecedores estão ativos, o controller cancela os perdedores:

- Pan excede o limiar → longpress e swipe cancelam.
- Swipe libera → pan cancela.
- Timer de longpress dispara → tap e swipe cancelam.

## Opções do plugin

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `mouseButtons` | `[0]` | Botões do mouse que podem iniciar reconhecimento (`0` = esquerdo, `2` = direito). Touch sempre usa `0`. |

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

// depois
ctrl.destroy();
```

## Integração Alpine

### Store (`$store.gesture`)

Snapshot reativo do evento de gesto mais recente, atualizado a cada gesto reconhecido.

### Magic (`$gesture`)

Retorna o objeto de estado de gesto atual.

### Diretiva (`x-gesture`)

```html
<div x-data="{ onPan(e) { /* … */ } }">
  <div x-gesture:pan="onPan">Drag me</div>
</div>
```

### Pinch zoom

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
