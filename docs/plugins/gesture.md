---
title: Gesture
description: Headless pointer-driven gesture recognition for Alpine.js
---

Headless gesture recognition — tap, double-tap, long-press, swipe, pan, and pinch via pointer events. **CSS-framework agnostic** — no markup, no styles. The controller recognises gestures and emits structured events; you wire your own UI.

## Install

```bash
pnpm add @ailuracode/alpine-gesture alpinejs
```

## Plugin

```ts
import Alpine from "alpinejs";
import gesture from "@ailuracode/alpine-gesture";

Alpine.plugin(gesture());
Alpine.start();
```

Registers `$store.gesture`, the `$gesture` magic, and the `x-gesture` directive.

## Recognised gestures

| Gesture | Events | Detail shape | Notes |
|---------|--------|--------------|-------|
| `tap` | `tap` | `{ kind, x, y, target }` | Press + release under `tapThreshold` (10 px) within 300 ms |
| `doubletap` | `doubletap` | `{ kind, x, y, target }` | Two taps within `doubleTapInterval` (300 ms) |
| `longpress` | `longpress` | `{ kind, x, y, target }` | Held for `longPressDelay` (500 ms) |
| `swipe` | `swipe` | `{ kind, direction, velocityX, velocityY, x, y, target }` | Release exceeding `swipeThreshold` (50 px) and `swipeVelocity` (0.3 px/ms) |
| `pan` | `pan` | `{ kind, phase, distanceX, distanceY, velocityX, velocityY, direction, x, y, target }` | Drag exceeding `panThreshold` (10 px); `phase` is `start`, `move`, or `end` |
| `pinch` | `pinch` | `{ kind, phase, scale, rotation, distanceX, distanceY, x, y, target }` | Two-pointer spread; `phase` is `start`, `move`, or `end` |

The controller also emits a generic `gesture` event with `{ kind, state, originalEvent }` for every recognised gesture, and a `change` event for every state transition.

## Directive

`x-gesture:<kind>="handler"` creates a per-element controller that recognises one kind and calls the named method in the component scope.

```html
<div x-data="{ handleSwipe(d) { console.log(d.direction) } }">
  <div x-gesture:swipe="handleSwipe">Swipe me</div>
</div>
```

The handler is invoked with the gesture detail as its first argument. The same `detail` is also dispatched as a bubbling `CustomEvent` named after the gesture kind (`tap`, `swipe`, …), so you can listen with `@swipe="…"` instead.

### Multiple gestures on one element

Each `x-gesture:<kind>` registers its own controller, so a single element can mix recognisers:

```html
<div
  x-data="{
    onTap() { this.last = 'tap' },
    onSwipe(d) { this.last = 'swipe ' + d.direction }
  }"
>
  <div x-gesture:tap="onTap" x-gesture:swipe="onSwipe">Interact here</div>
</div>
```

## Competing gestures

When several recognisers are active the controller cancels losers deterministically:

- Pan exceeds `panThreshold` → longpress and swipe cancel.
- Swipe releases → pan cancels.
- Longpress timer fires → tap and swipe cancel.
- More than one pointer → single-pointer recognisers suspend; pinch takes over.

## Plugin options

| Option | Default | Description |
|--------|---------|-------------|
| `tapThreshold` | `10` | Max distance (px) between press and release to count as a tap |
| `doubleTapInterval` | `300` | Max gap (ms) between two taps to count as a double-tap |
| `longPressDelay` | `500` | Hold time (ms) before `longpress` fires |
| `swipeThreshold` | `50` | Min distance (px) for a swipe to be recognised |
| `swipeVelocity` | `0.3` | Min release velocity (px/ms) for a swipe |
| `panThreshold` | `10` | Min distance (px) before pan recognition starts |
| `axisLock` | `"none"` | `"horizontal"` or `"vertical"` locks swipe/pan to one axis |
| `pinchThreshold` | `10` | Min spread (px) before pinch recognition starts |
| `capturePointer` | `true` | Use `setPointerCapture` for reliable off-element tracking |
| `preventDefault` | `false` | Reserved — currently a no-op marker for future native-event cancellation |

The directive accepts the same options when invoked through the plugin factory. Each `x-gesture` element instantiates its own controller, so thresholds are per-element.

## Store (`$store.gesture`)

A reactive snapshot of the latest recognised gesture state:

| Field | Type | Description |
|-------|------|-------------|
| `active` | `boolean` | Whether a gesture is currently being tracked |
| `kind` | `GestureKind \| null` | The last recognised kind, or `null` when idle |
| `x`, `y` | `number` | Pointer position relative to the element |
| `distanceX`, `distanceY` | `number` | Accumulated distance from the gesture start (px) |
| `totalDistance` | `number` | Magnitude of the distance vector (px) |
| `velocityX`, `velocityY` | `number` | Current velocity (px/ms) |
| `pointerCount` | `number` | Active pointer count (pinch awareness) |
| `scale` | `number` | Pinch scale factor (`1` when idle) |
| `rotation` | `number` | Pinch rotation in degrees |
| `direction` | `GestureDirection` | Last resolved direction: `up`, `down`, `left`, `right`, or `none` |
| `cancel()` | `() => void` | Abort the current gesture |

The store is best-effort — for state that drives animations or transitions, subscribe to the controller events directly.

## Standalone usage (no Alpine)

```ts
import { createGesture, GestureController } from "@ailuracode/alpine-gesture";

// One-shot helper — creates + mounts a controller on the element.
const ctrl = createGesture(document.getElementById("surface")!, {
  gestures: ["swipe", "pan"],
  panThreshold: 10,
  swipeThreshold: 30,
});

ctrl.on("swipe", (detail) => console.log(detail.direction));
ctrl.on("pan", (detail) => {
  if (detail.phase === "move") drawGuide(detail.distanceX, detail.distanceY);
});

// later
ctrl.destroy();
```

| Controller API | Description |
|----------------|-------------|
| `mount()` | Attach pointer listeners (idempotent) |
| `destroy()` | Remove listeners and release pointer capture |
| `attach(element)` / `detach()` | Switch the target element |
| `cancel()` | Abort the in-flight gesture |
| `state` | Current `GestureState` snapshot |
| `isTracking` | Whether a gesture is active |
| `on(event, listener)` | Subscribe to typed events (`tap`, `swipe`, `pan`, …, `gesture`, `change`) |

## Accessibility

- Pointer gestures alone are **not accessible**. Pair every gesture-driven interaction with a keyboard or click equivalent (button, menu trigger, etc.).
- Avoid hiding critical functionality behind `swipe` or `pinch` without a non-pointer fallback.
- Long press is sometimes announced as a touch-and-hold gesture; expose the same action via a long-press button or context menu.

## SSR

The constructor never touches `window`, `document`, or timers — safe to instantiate during SSR. Side effects start only when `mount()` is called on the client.

## Limitations

- Multi-touch beyond two pointers is not modelled — only the first two pointers drive pinch.
- Velocity thresholds assume the browser provides `PointerEvent.timeStamp` in ms (modern browsers do).
- The directive creates one `GestureController` per `x-gesture:<kind>` directive; on a busy page prefer a single explicit controller and the store instead.
- Pointer capture (default on) keeps the gesture alive when the pointer leaves the element, but it also means subsequent `pointermove` events on other elements are routed to the capturing element until `pointerup`.