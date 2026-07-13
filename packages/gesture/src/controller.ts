/**
 * Gesture controller — the framework-agnostic core of
 * `@ailuracode/alpine-gesture`.
 *
 * Recognizes tap, double-tap, long-press, swipe, pan, and pinch
 * gestures through explicit pointer-event inputs. Competing gestures
 * have deterministic recognition and cancellation rules.
 *
 * Construction rules (per `.cursor/rules/new-package.mdc`):
 * - The constructor MUST NOT touch `window` / `document` / timers.
 * - `mount(element)` attaches pointer-event listeners to the element.
 * - `destroy()` cleans up all listeners and pointer capture.
 */

import { BaseController, isBrowser, ToolkitError } from "@ailuracode/alpine-core";
import type { GestureEvents } from "./events";
import {
  applyAxisLock,
  computeVelocity,
  type PointerSnapshot,
  resolveDirection,
} from "./internal/pointer";
import {
  DoubleTapRecognizer,
  LongPressRecognizer,
  PanRecognizer,
  PinchRecognizer,
  type RecognizerConfig,
  SwipeRecognizer,
  TapRecognizer,
} from "./internal/recognizer";
import { type NormalizedGestureOptions, normalizeGestureOptions } from "./options";
import type {
  GestureKind,
  GesturePanDetail,
  GesturePinchDetail,
  GestureState,
  GestureSwipeDetail,
} from "./types";

/**
 * Stable registry key for the gesture controller singleton.
 */
export const GESTURE_SINGLETON_KEY = "@ailuracode/alpine-gesture/default";

/**
 * Creates a snapshot of the current pointer state.
 */
function snapshotPointer(event: PointerEvent): {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
} {
  return {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    timestamp: event.timeStamp,
    pressure: event.pressure,
  };
}

function emptyState(): GestureState {
  return {
    active: false,
    kind: null,
    x: 0,
    y: 0,
    distanceX: 0,
    distanceY: 0,
    totalDistance: 0,
    velocityX: 0,
    velocityY: 0,
    pointerCount: 0,
    scale: 1,
    rotation: 0,
    direction: "none",
  };
}

export class GestureController extends BaseController<GestureEvents> {
  readonly #options: NormalizedGestureOptions;
  #element: Element | null = null;
  #pointers = new Map<number, PointerSnapshot>();
  #startX = 0;
  #startY = 0;
  #startTimestamp = 0;
  #state: GestureState = emptyState();
  #previousState: GestureState = emptyState();
  #activeKind: GestureKind | null = null;
  #initialPinchDistance = 0;
  #initialPinchRotation = 0;

  // Recognizers
  readonly #tapRecognizer = new TapRecognizer();
  readonly #doubleTapRecognizer = new DoubleTapRecognizer();
  readonly #longPressRecognizer = new LongPressRecognizer();
  readonly #swipeRecognizer = new SwipeRecognizer();
  readonly #panRecognizer = new PanRecognizer();
  readonly #pinchRecognizer = new PinchRecognizer();

  // Bound handlers for cleanup
  #onPointerDown: EventListenerOrEventListenerObject | null = null;
  #onPointerMove: EventListenerOrEventListenerObject | null = null;
  #onPointerUp: EventListenerOrEventListenerObject | null = null;
  #onPointerCancel: EventListenerOrEventListenerObject | null = null;
  #onPointerLeave: EventListenerOrEventListenerObject | null = null;

  // Long press callback wiring

  constructor(options: import("./types").GestureOptions = {}) {
    super(options.id ?? "gesture");
    this.#options = normalizeGestureOptions(options);
    this.#element = options.element ?? null;
    this.#longPressRecognizer.setCallback(() => {
      this.#handleLongPressRecognized();
    });
  }

  // ── Public state surface ────────────────────────────────────────

  get state(): GestureState {
    return this.#state;
  }

  get isTracking(): boolean {
    return this.#state.active;
  }

  get element(): Element | null {
    return this.#element;
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();
    if (this.#element && isBrowser()) {
      this.#attachListeners(this.#element);
    }
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#detachListeners();
    this.#cancelAllRecognizers();
    this.#pointers.clear();
    this.#element = null;
    super.destroy();
  }

  // ── Commands ────────────────────────────────────────────────────

  attach(element: Element): void {
    if (this.isDestroyed) {
      throw new ToolkitError(
        `Cannot use gesture controller "${this.id}" after destroy()`,
        "CONTROLLER_DESTROYED"
      );
    }
    if (this.#element === element) {
      return;
    }
    this.#detachListeners();
    this.#cancelAllRecognizers();
    this.#pointers.clear();
    this.#element = element;
    if (this.isMounted && isBrowser()) {
      this.#attachListeners(element);
    }
  }

  detach(): void {
    this.#assertAlive();
    this.#detachListeners();
    this.#cancelAllRecognizers();
    this.#pointers.clear();
    this.#element = null;
    this.#resetState();
  }

  cancel(): void {
    this.#assertAlive();
    this.#cancelAllRecognizers();
    this.#pointers.clear();
    this.#releasePointerCapture();
    this.#resetState();
  }

  // ── Private: listener management ────────────────────────────────

  #attachListeners(element: Element): void {
    this.#onPointerDown = (e: Event) => this.#handlePointerDown(e as PointerEvent);
    this.#onPointerMove = (e: Event) => this.#handlePointerMove(e as PointerEvent);
    this.#onPointerUp = (e: Event) => this.#handlePointerUp(e as PointerEvent);
    this.#onPointerCancel = (e: Event) => this.#handlePointerCancel(e as PointerEvent);
    this.#onPointerLeave = (e: Event) => this.#handlePointerLeave(e as PointerEvent);

    element.addEventListener("pointerdown", this.#onPointerDown, {
      passive: false,
    });
    element.addEventListener("pointermove", this.#onPointerMove, {
      passive: true,
    });
    element.addEventListener("pointerup", this.#onPointerUp, {
      passive: true,
    });
    element.addEventListener("pointercancel", this.#onPointerCancel, {
      passive: true,
    });
    element.addEventListener("pointerleave", this.#onPointerLeave, {
      passive: true,
    });

    this.registerCleanup(() => this.#detachListeners());
  }

  #detachListeners(): void {
    if (!this.#element) {
      return;
    }
    if (this.#onPointerDown) {
      this.#element.removeEventListener("pointerdown", this.#onPointerDown);
    }
    if (this.#onPointerMove) {
      this.#element.removeEventListener("pointermove", this.#onPointerMove);
    }
    if (this.#onPointerUp) {
      this.#element.removeEventListener("pointerup", this.#onPointerUp);
    }
    if (this.#onPointerCancel) {
      this.#element.removeEventListener("pointercancel", this.#onPointerCancel);
    }
    if (this.#onPointerLeave) {
      this.#element.removeEventListener("pointerleave", this.#onPointerLeave);
    }
    this.#onPointerDown = null;
    this.#onPointerMove = null;
    this.#onPointerUp = null;
    this.#onPointerCancel = null;
    this.#onPointerLeave = null;
  }

  #releasePointerCapture(): void {
    if (this.#element && isBrowser()) {
      try {
        (this.#element as HTMLElement).releasePointerCapture?.(-1);
      } catch {
        // Ignore — not all elements support pointer capture
      }
    }
  }

  // ── Private: pointer event handlers ─────────────────────────────

  #handlePointerDown(event: PointerEvent): void {
    if (this.isDestroyed) {
      return;
    }

    const snap = snapshotPointer(event);
    this.#pointers.set(snap.id, snap);

    if (this.#pointers.size === 1) {
      this.#initFirstPointer(snap);
    }

    if (this.#options.gestures.has("pinch") && this.#pointers.size >= 2) {
      const aggregate = this.#buildAggregate();
      this.#initialPinchDistance = aggregate.distance;
      this.#initialPinchRotation = aggregate.rotation;
      this.#pinchRecognizer.pointerDown(snap, aggregate);
    }

    this.#updatePointerCount();
  }

  #initFirstPointer(snap: PointerSnapshot): void {
    this.#startX = snap.x;
    this.#startY = snap.y;
    this.#startTimestamp = snap.timestamp;
    this.#cancelAllRecognizers();

    const gestures = this.#options.gestures;
    if (gestures.has("tap")) {
      this.#tapRecognizer.pointerDown(snap);
    }
    if (gestures.has("doubletap")) {
      this.#doubleTapRecognizer.pointerDown(snap);
    }
    if (gestures.has("longpress")) {
      this.#longPressRecognizer.pointerDown(snap, this.#getRecognizerConfig());
    }
    if (gestures.has("swipe")) {
      this.#swipeRecognizer.pointerDown(snap);
    }
    if (gestures.has("pan")) {
      this.#panRecognizer.pointerDown(snap);
    }

    if (this.#options.capturePointer && this.#element) {
      try {
        (this.#element as HTMLElement).setPointerCapture(snap.id);
      } catch {
        // Ignore — not all elements support pointer capture
      }
    }
  }

  #handlePointerMove(event: PointerEvent): void {
    if (this.isDestroyed) {
      return;
    }

    const snap = snapshotPointer(event);
    this.#pointers.set(snap.id, snap);

    if (this.#pointers.size === 1) {
      this.#handleSinglePointerMove(snap);
    } else if (this.#pointers.size >= 2 && this.#options.gestures.has("pinch")) {
      this.#handleMultiPointerMove(snap);
    }
  }

  #handleSinglePointerMove(snap: PointerSnapshot): void {
    const config = this.#getRecognizerConfig();
    const dx = snap.x - this.#startX;
    const dy = snap.y - this.#startY;
    const locked = applyAxisLock(dx, dy, config.axisLock);

    this.#cancelCompetingOnMove(snap, config);

    this.#handlePanMove(snap, config, locked);

    this.#updatePosition(snap);
  }

  #cancelCompetingOnMove(snap: PointerSnapshot, config: RecognizerConfig): void {
    if (this.#longPressRecognizer.isTracking) {
      const lpResult = this.#longPressRecognizer.pointerMove(snap, config);
      if (lpResult.failed) {
        this.#cancelCompeting("longpress");
      }
    }

    if (this.#swipeRecognizer.isTracking) {
      const swResult = this.#swipeRecognizer.pointerMove(snap, config);
      if (swResult.failed) {
        this.#cancelCompeting("swipe");
      }
    }
  }

  #handlePanMove(
    snap: PointerSnapshot,
    config: RecognizerConfig,
    locked: { dx: number; dy: number }
  ): void {
    if (!(this.#panRecognizer.isTracking || this.#panRecognizer.isPending)) {
      return;
    }
    const wasPending = this.#panRecognizer.isPending;
    const panResult = this.#panRecognizer.pointerMove(snap, config);
    if (wasPending && panResult.recognized) {
      this.#cancelCompeting("pan");
      this.#activeKind = "pan";
      this.#beginGesture("pan");
      this.#emitPanMove(snap, locked, "start");
    } else if (this.#panRecognizer.isTracking) {
      this.#emitPanMove(snap, locked);
    }
    if (panResult.failed) {
      this.#cancelCompeting("pan");
    }
  }

  #updatePosition(snap: PointerSnapshot): void {
    this.#state = {
      ...this.#state,
      x: snap.x - (this.#element?.getBoundingClientRect().left ?? 0),
      y: snap.y - (this.#element?.getBoundingClientRect().top ?? 0),
    };
  }

  #handleMultiPointerMove(snap: PointerSnapshot): void {
    const aggregate = this.#buildAggregate();
    const config = this.#getRecognizerConfig();
    const pinchResult = this.#pinchRecognizer.pointerMove(snap, aggregate, config);

    if (pinchResult.recognized && this.#pinchRecognizer.isTracking) {
      if (this.#activeKind !== "pinch") {
        this.#cancelCompeting("pinch");
        this.#activeKind = "pinch";
        this.#beginGesture("pinch");
      }
      const scale =
        aggregate.distance > 0 && this.#getInitialPinchDistance() > 0
          ? aggregate.distance / this.#getInitialPinchDistance()
          : 1;
      const rotation = aggregate.rotation - this.#getInitialPinchRotation();
      this.#emitPinchMove(snap, scale, rotation);
    }

    if (pinchResult.failed) {
      this.#cancelCompeting("pinch");
    }
  }

  #handlePointerUp(event: PointerEvent): void {
    if (this.isDestroyed) {
      return;
    }

    const snap = snapshotPointer(event);
    this.#pointers.delete(snap.id);

    if (this.#pointers.size === 0) {
      this.#resolveGestures(snap);
      this.#releasePointerCapture();
    } else if (this.#pointers.size === 1 && this.#options.gestures.has("pinch")) {
      // Transition from pinch back to single-pointer tracking
      const remaining = Array.from(this.#pointers.values())[0];
      this.#startX = remaining.x;
      this.#startY = remaining.y;
      if (this.#activeKind === "pinch") {
        this.#pinchRecognizer.cancel();
        this.#activeKind = null;
      }
    }

    this.#updatePointerCount();
  }

  #handlePointerCancel(event: PointerEvent): void {
    if (this.isDestroyed) {
      return;
    }
    const snap = snapshotPointer(event);
    this.#pointers.delete(snap.id);
    if (this.#pointers.size === 0) {
      this.#cancelAllRecognizers();
      this.#releasePointerCapture();
      this.#resetState();
    }
    this.#updatePointerCount();
  }

  #handlePointerLeave(_event: PointerEvent): void {
    if (this.isDestroyed) {
      return;
    }
    // Only cancel if all pointers have left
    if (this.#pointers.size <= 1) {
      this.#cancelAllRecognizers();
      this.#pointers.clear();
      this.#releasePointerCapture();
      this.#resetState();
    }
  }

  // ── Private: gesture resolution ─────────────────────────────────

  #resolveGestures(snap: PointerSnapshot): void {
    if (this.#activeKind) {
      this.#endActiveGesture(snap);
      return;
    }

    const config = this.#getRecognizerConfig();

    // Order matters: check more specific gestures first
    if (this.#doubleTapRecognizer.isTracking) {
      const result = this.#doubleTapRecognizer.pointerUp(snap, config);
      if (result.recognized) {
        this.#emitDoubleTap(snap);
        return;
      }
    }

    if (this.#longPressRecognizer.isTracking) {
      this.#longPressRecognizer.pointerUp();
    }

    if (this.#swipeRecognizer.isTracking) {
      const swipeStart = this.#swipeRecognizer.startSnapshot;
      const result = this.#swipeRecognizer.pointerUp(snap, config);
      if (result.recognized && swipeStart) {
        this.#emitSwipeWithStart(snap, config, swipeStart);
        return;
      }
    }

    if (this.#panRecognizer.isTracking) {
      this.#panRecognizer.pointerUp(snap, config);
      this.#emitPanEnd(snap);
      return;
    }

    if (this.#tapRecognizer.isTracking) {
      const result = this.#tapRecognizer.pointerUp(snap, config);
      if (result.recognized) {
        this.#emitTap(snap);
        return;
      }
    }

    this.#resetState();
  }

  #endActiveGesture(snap: PointerSnapshot): void {
    const kind = this.#activeKind;
    this.#activeKind = null;

    if (kind === "pan") {
      this.#emitPanEnd(snap);
    } else if (kind === "pinch") {
      this.#emitPinchEnd(snap);
    } else {
      this.#resetState();
    }
  }

  #cancelCompeting(except: GestureKind): void {
    if (except !== "tap" && this.#tapRecognizer.isTracking) {
      this.#tapRecognizer.cancel();
    }
    if (except !== "doubletap" && this.#doubleTapRecognizer.isTracking) {
      this.#doubleTapRecognizer.cancel();
    }
    if (except !== "longpress" && this.#longPressRecognizer.isTracking) {
      this.#longPressRecognizer.cancel();
    }
    if (except !== "swipe" && this.#swipeRecognizer.isTracking) {
      this.#swipeRecognizer.cancel();
    }
    if (except !== "pan" && this.#panRecognizer.isTracking) {
      this.#panRecognizer.cancel();
    }
    if (except !== "pinch" && this.#pinchRecognizer.isTracking) {
      this.#pinchRecognizer.cancel();
    }
  }

  #cancelAllRecognizers(): void {
    this.#tapRecognizer.cancel();
    this.#doubleTapRecognizer.cancel();
    this.#longPressRecognizer.cancel();
    this.#swipeRecognizer.cancel();
    this.#panRecognizer.cancel();
    this.#pinchRecognizer.cancel();
    this.#activeKind = null;
  }

  // ── Private: emit helpers ───────────────────────────────────────

  #beginGesture(kind: GestureKind): void {
    const rect = this.#element?.getBoundingClientRect();
    this.#previousState = { ...this.#state };
    this.#state = {
      ...this.#state,
      active: true,
      kind,
      x: this.#startX - (rect?.left ?? 0),
      y: this.#startY - (rect?.top ?? 0),
      pointerCount: this.#pointers.size,
    };
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #emitTap(snap: { x: number; y: number }): void {
    const rect = this.#element?.getBoundingClientRect();
    const detail = {
      kind: "tap" as const,
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
      target: this.#element,
    };
    this.#previousState = { ...this.#state };
    this.#state = {
      ...emptyState(),
      x: detail.x,
      y: detail.y,
    };
    this.emit("tap", detail);
    this.emit("gesture", {
      kind: "tap",
      state: this.#state,
      originalEvent: null,
    });
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #emitDoubleTap(snap: { x: number; y: number }): void {
    const rect = this.#element?.getBoundingClientRect();
    const detail = {
      kind: "doubletap" as const,
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
      target: this.#element,
    };
    this.#previousState = { ...this.#state };
    this.#state = {
      ...emptyState(),
      x: detail.x,
      y: detail.y,
    };
    this.emit("doubletap", detail);
    this.emit("gesture", {
      kind: "doubletap",
      state: this.#state,
      originalEvent: null,
    });
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #handleLongPressRecognized(): void {
    if (this.isDestroyed || !this.#element) {
      return;
    }
    const rect = this.#element.getBoundingClientRect();
    const detail = {
      kind: "longpress" as const,
      x: this.#startX - rect.left,
      y: this.#startY - rect.top,
      target: this.#element,
    };
    this.#previousState = { ...this.#state };
    this.#state = {
      ...emptyState(),
      active: true,
      kind: "longpress",
      x: detail.x,
      y: detail.y,
    };
    this.emit("longpress", detail);
    this.emit("gesture", {
      kind: "longpress",
      state: this.#state,
      originalEvent: null,
    });
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #emitSwipeWithStart(
    snap: PointerSnapshot,
    config: RecognizerConfig,
    start: PointerSnapshot
  ): void {
    const dx = snap.x - start.x;
    const dy = snap.y - start.y;
    const locked = applyAxisLock(dx, dy, config.axisLock);
    const vel = computeVelocity(start, snap);
    const direction = resolveDirection(locked.dx, locked.dy);
    const rect = this.#element?.getBoundingClientRect();

    const detail: GestureSwipeDetail = {
      kind: "swipe",
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
      target: this.#element,
      direction,
      velocityX: vel.velocityX,
      velocityY: vel.velocityY,
    };

    this.#previousState = { ...this.#state };
    this.#state = {
      ...emptyState(),
      x: detail.x,
      y: detail.y,
      direction,
      velocityX: vel.velocityX,
      velocityY: vel.velocityY,
    };
    this.emit("swipe", detail);
    this.emit("gesture", {
      kind: "swipe",
      state: this.#state,
      originalEvent: null,
    });
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #emitPanMove(
    snap: PointerSnapshot,
    locked: { dx: number; dy: number },
    phase: "start" | "move" = "move"
  ): void {
    const vel = computeVelocity(
      { id: 0, x: this.#startX, y: this.#startY, timestamp: this.#startTimestamp, pressure: 0 },
      { id: 0, x: snap.x, y: snap.y, timestamp: snap.timestamp, pressure: 0 }
    );
    const direction = resolveDirection(locked.dx, locked.dy);
    const rect = this.#element?.getBoundingClientRect();

    const detail: GesturePanDetail = {
      kind: "pan",
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
      target: this.#element,
      phase,
      distanceX: locked.dx,
      distanceY: locked.dy,
      velocityX: vel.velocityX,
      velocityY: vel.velocityY,
      direction,
    };

    this.#state = {
      ...this.#state,
      distanceX: locked.dx,
      distanceY: locked.dy,
      totalDistance: Math.hypot(locked.dx, locked.dy),
      velocityX: vel.velocityX,
      velocityY: vel.velocityY,
      direction,
      x: detail.x,
      y: detail.y,
    };

    if (this.#options.preventDefault) {
      // Signal to caller that default should be prevented
    }

    this.emit("pan", detail);
    this.emit("gesture", {
      kind: "pan",
      state: this.#state,
      originalEvent: null,
    });
  }

  #emitPanEnd(snap: { x: number; y: number }): void {
    const rect = this.#element?.getBoundingClientRect();
    const dx = snap.x - this.#startX;
    const dy = snap.y - this.#startY;
    const locked = applyAxisLock(dx, dy, this.#getRecognizerConfig().axisLock);
    const direction = resolveDirection(locked.dx, locked.dy);

    const detail: GesturePanDetail = {
      kind: "pan",
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
      target: this.#element,
      phase: "end",
      distanceX: locked.dx,
      distanceY: locked.dy,
      velocityX: 0,
      velocityY: 0,
      direction,
    };

    this.#previousState = { ...this.#state };
    this.#state = {
      ...emptyState(),
      x: detail.x,
      y: detail.y,
      direction,
    };
    this.emit("pan", detail);
    this.emit("gesture", {
      kind: "pan",
      state: this.#state,
      originalEvent: null,
    });
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #emitPinchMove(snap: { x: number; y: number }, scale: number, rotation: number): void {
    const rect = this.#element?.getBoundingClientRect();
    this.#state = {
      ...this.#state,
      scale,
      rotation,
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
    };

    const detail: GesturePinchDetail = {
      kind: "pinch",
      x: this.#state.x,
      y: this.#state.y,
      target: this.#element,
      phase: "move",
      scale,
      rotation,
      distanceX: this.#state.distanceX,
      distanceY: this.#state.distanceY,
    };
    this.emit("pinch", detail);
    this.emit("gesture", {
      kind: "pinch",
      state: this.#state,
      originalEvent: null,
    });
  }

  #emitPinchEnd(snap: { x: number; y: number }): void {
    const rect = this.#element?.getBoundingClientRect();
    this.#previousState = { ...this.#state };
    this.#state = {
      ...emptyState(),
      x: snap.x - (rect?.left ?? 0),
      y: snap.y - (rect?.top ?? 0),
    };
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  #resetState(): void {
    this.#previousState = { ...this.#state };
    this.#state = emptyState();
    this.emit("change", {
      state: this.#state,
      previous: this.#previousState,
    });
  }

  // ── Private: helpers ────────────────────────────────────────────

  #assertAlive(): void {
    if (this.isDestroyed) {
      throw new ToolkitError(
        `Cannot use gesture controller "${this.id}" after destroy()`,
        "CONTROLLER_DESTROYED"
      );
    }
    if (!this.isMounted) {
      throw new ToolkitError(
        `Cannot use gesture controller "${this.id}" before mount()`,
        "TOOLKIT_INVALID_STATE"
      );
    }
  }

  #getRecognizerConfig(): RecognizerConfig {
    return {
      tapThreshold: this.#options.tapThreshold,
      doubleTapInterval: this.#options.doubleTapInterval,
      longPressDelay: this.#options.longPressDelay,
      swipeThreshold: this.#options.swipeThreshold,
      swipeVelocity: this.#options.swipeVelocity,
      panThreshold: this.#options.panThreshold,
      axisLock: this.#options.axisLock,
      pinchThreshold: this.#options.pinchThreshold,
    };
  }

  #buildAggregate(): {
    centerX: number;
    centerY: number;
    count: number;
    distance: number;
    rotation: number;
  } {
    const values = Array.from(this.#pointers.values());
    let sumX = 0;
    let sumY = 0;
    for (const p of values) {
      sumX += p.x;
      sumY += p.y;
    }
    const centerX = sumX / values.length;
    const centerY = sumY / values.length;

    if (values.length < 2) {
      return { centerX, centerY, count: values.length, distance: 0, rotation: 0 };
    }

    const p0 = values[0];
    const p1 = values[1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    return {
      centerX,
      centerY,
      count: values.length,
      distance: Math.hypot(dx, dy),
      rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
    };
  }

  #getInitialPinchDistance(): number {
    return this.#initialPinchDistance;
  }

  #getInitialPinchRotation(): number {
    return this.#initialPinchRotation;
  }

  #updatePointerCount(): void {
    if (this.#state.active) {
      this.#state = {
        ...this.#state,
        pointerCount: this.#pointers.size,
      };
    }
  }
}
