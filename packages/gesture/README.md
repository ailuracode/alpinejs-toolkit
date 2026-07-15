# @ailuracode/alpine-gesture

Headless gesture recognition for Alpine.js — tap, swipe, pan, pinch, and long press via pointer events.

**CSS-framework agnostic** — no markup, no styles. The controller recognises gestures and emits structured events; you wire your own UI.

## Install

```bash
pnpm add @ailuracode/alpine-gesture alpinejs
```

## Quick start

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

## Plugin options

| Option | Default | Description |
|--------|---------|-------------|
| `mouseButtons` | `[0]` | Mouse buttons that may start recognition (`0` = left, `2` = right). Touch always uses `0`. |
| `storeKey` | `'gesture'` | `$store` key the Alpine plugin registers under |
| `magicKey` | `'gesture'` (or `storeKey` when renamed) | `$gesture` magic key the Alpine plugin registers under |
| `directiveKey` | `'gesture'` | `Alpine.directive()` key (paired with `x-gesture` markup) |

### Avoiding name collisions

If your application already owns a `$store.gesture`, a `$gesture` magic, or an `x-gesture` directive (or another toolkit plugin hits those names first), rename the integration surfaces without touching the controller:

```ts
Alpine.plugin(gesturePlugin({
  storeKey: "pointer",        // → $store.pointer
  // magicKey follows storeKey by default → $pointer
  magicKey: "gestureState",   // explicit override → $gestureState
  directiveKey: "swipe",      // → x-swipe
}));
```

`storeKey` is the only argument most hosts need. `magicKey` follows the store when both must move out of a collided name, and `directiveKey` is independent — keep it separate when only the markup collides with another `x-gesture`. The exposed constants `DEFAULT_GESTURE_STORE_KEY`, `DEFAULT_GESTURE_MAGIC_KEY`, and `DEFAULT_GESTURE_DIRECTIVE_KEY` keep the renames discoverable from TypeScript.

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

## License

MIT
