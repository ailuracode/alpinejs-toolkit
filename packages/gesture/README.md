# @ailuracode/alpine-gesture

Headless gesture recognition for Alpine.js — tap, swipe, pan, pinch, and long press via pointer events.

**CSS-framework agnostic** — no markup, no styles. The controller recognises gestures and emits structured events; you wire your own UI.

## Install

```bash
pnpm add @ailuracode/alpine-gesture alpinejs
```

## Quick example

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

## Recognised gestures

| Gesture | Events | Notes |
|---------|--------|-------|
| **tap** | `tap` | Short press under 300 ms |
| **doubletap** | `doubletap` | Two taps within `doubleTapInterval` |
| **longpress** | `longpress` | Held for `longPressDelay` ms |
| **swipe** | `swipe` | Fast release exceeding `swipeThreshold` |
| **pan** | `pan` (start / move / end) | Drag exceeding `panThreshold` |
| **pinch** | `pinch` (start / move / end) | Two-pointer spread or pinch |

## Competing gestures

When multiple recognisers are active the controller cancels losers:

- Pan exceeds threshold → longpress and swipe cancel.
- Swipe releases → pan cancels.
- Longpress timer fires → tap and swipe cancel.

## Headless API

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

// later
ctrl.destroy();
```

## Alpine integration

### Store (`$store.gesture`)

A reactive snapshot of the most recent gesture event, updated on every recognised gesture.

### Magic (`$gesture`)

Returns the current gesture state object.

### Directive (`x-gesture`)

```html
<div x-data="{ onPan(e) { /* … */ } }">
  <div x-gesture:pan="onPan">Drag me</div>
</div>
```
