/**
 * Headless timer controller — drift-resistant timing engine.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core/controller";
import { EventEmitter, generateId } from "@ailuracode/alpine-core/controller";
import type { TimerEvents } from "./events.js";
import { buildFormatParts } from "./format-duration.js";
import { type NormalizedTimerOptions, normalizeCreateTimerOptions } from "./options.js";
import {
  createIntervalScheduler,
  createMonotonicClock,
  type MonotonicClock,
  type Scheduler,
} from "./scheduler.js";
import type {
  CreateTimerOptions,
  TimerController,
  TimerDirection,
  TimerSnapshot,
} from "./types.js";

type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface TimerDependencies {
  readonly clock: MonotonicClock;
  readonly scheduler: Scheduler;
}

const defaultDependencies: TimerDependencies = {
  clock: createMonotonicClock(),
  scheduler: createIntervalScheduler(),
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class TimerControllerImpl implements TimerController {
  readonly #emitter = new EventEmitter<TimerEvents>();
  readonly #options: NormalizedTimerOptions;
  readonly #clock: MonotonicClock;
  readonly #scheduler: Scheduler;
  readonly #id: string;

  #accumulatedElapsed: number;
  #startedAt: number | null = null;
  #running = false;
  #paused = false;
  #completed = false;
  #iteration = 0;
  #destroyed = false;
  #mounted = false;
  #cancelSchedule: (() => void) | null = null;

  constructor(
    options: CreateTimerOptions = {},
    dependencies: TimerDependencies = defaultDependencies
  ) {
    this.#options = normalizeCreateTimerOptions(options);
    this.#clock = dependencies.clock;
    this.#scheduler = dependencies.scheduler;
    this.#id = this.#options.id ?? generateId("timer");
    this.#accumulatedElapsed = this.#options.initialElapsed;
  }

  get id(): string {
    return this.#id;
  }

  get direction(): TimerDirection {
    return this.#options.direction;
  }

  get running(): boolean {
    return this.#running;
  }

  get paused(): boolean {
    return this.#paused;
  }

  get completed(): boolean {
    return this.#completed;
  }

  get elapsed(): number {
    return this.#computeElapsed();
  }

  get remaining(): number | null {
    if (this.#options.duration === null) {
      return null;
    }
    return Math.max(0, this.#options.duration - this.elapsed);
  }

  get duration(): number | null {
    return this.#options.duration;
  }

  get progress(): number | null {
    if (this.#options.duration === null || this.#options.duration <= 0) {
      return null;
    }
    return clamp(this.elapsed / this.#options.duration, 0, 1);
  }

  get formatted(): string {
    return this.#options.format(buildFormatParts(this.elapsed, this.remaining));
  }

  get iteration(): number {
    return this.#iteration;
  }

  get isMounted(): boolean {
    return this.#mounted;
  }

  get isDestroyed(): boolean {
    return this.#destroyed;
  }

  on<K extends keyof TimerEvents>(
    event: K,
    listener: (detail: TimerEvents[K]) => void
  ): Unsubscribe {
    return this.#emitter.on(event, listener);
  }

  start(): void {
    if (this.#destroyed || this.#running || this.#completed) {
      return;
    }

    this.#running = true;
    this.#paused = false;
    this.#startedAt = this.#clock.now();
    this.#startSchedule();
    this.#emitTick();
  }

  pause(): void {
    if (this.#destroyed || !this.#running || this.#paused) {
      return;
    }

    this.#accumulatedElapsed = this.#computeElapsed();
    this.#running = false;
    this.#paused = true;
    this.#startedAt = null;
    this.#stopSchedule();
    this.#emitTick();
  }

  resume(): void {
    if (this.#destroyed || this.#running || !this.#paused || this.#completed) {
      return;
    }

    this.#running = true;
    this.#paused = false;
    this.#startedAt = this.#clock.now();
    this.#startSchedule();
    this.#emitTick();
  }

  toggle(): void {
    if (this.#destroyed || this.#completed) {
      return;
    }

    if (this.#running) {
      this.pause();
      return;
    }

    if (this.#paused) {
      this.resume();
      return;
    }

    this.start();
  }

  reset(): void {
    if (this.#destroyed) {
      return;
    }

    this.#stopSchedule();
    this.#accumulatedElapsed = this.#options.initialElapsed;
    this.#startedAt = null;
    this.#running = false;
    this.#paused = false;
    this.#completed = false;
    this.#iteration = 0;
    this.#emitTick();
  }

  restart(): void {
    if (this.#destroyed) {
      return;
    }

    this.reset();
    this.start();
  }

  dispose(): void {
    if (this.#destroyed) {
      return;
    }

    this.#stopSchedule();
    this.#destroyed = true;
    this.#emitter.removeAllListeners();
  }

  mount(): void {
    if (this.#destroyed || this.#mounted) {
      return;
    }

    this.#mounted = true;
    if (this.#options.autoStart) {
      this.start();
    }
  }

  destroy(): void {
    this.dispose();
  }

  snapshot(): TimerSnapshot {
    return this.#snapshot();
  }

  #snapshot(): TimerSnapshot {
    return {
      direction: this.direction,
      running: this.running,
      paused: this.paused,
      completed: this.completed,
      elapsed: this.elapsed,
      remaining: this.remaining,
      duration: this.duration,
      progress: this.progress,
      formatted: this.formatted,
      iteration: this.iteration,
    };
  }

  #computeElapsed(): number {
    let elapsed = this.#accumulatedElapsed;
    if (this.#running && this.#startedAt !== null) {
      elapsed += this.#clock.now() - this.#startedAt;
    }

    if (this.#options.duration === null) {
      return elapsed;
    }

    return Math.min(elapsed, this.#options.duration);
  }

  #startSchedule(): void {
    this.#stopSchedule();
    this.#cancelSchedule = this.#scheduler.schedule(() => {
      this.#handleTick();
    }, this.#options.precision);
  }

  #stopSchedule(): void {
    if (this.#cancelSchedule) {
      this.#cancelSchedule();
      this.#cancelSchedule = null;
    }
  }

  #handleTick(): void {
    if (this.#destroyed) {
      return;
    }

    const elapsed = this.#computeElapsed();
    this.#emitTick();

    if (this.#options.duration === null) {
      return;
    }

    if (elapsed >= this.#options.duration) {
      this.#accumulatedElapsed = this.#options.duration;
      this.#completeCurrentRun();
    }
  }

  #completeCurrentRun(): void {
    this.#running = false;
    this.#paused = false;
    this.#startedAt = null;
    this.#completed = true;
    this.#stopSchedule();

    const snapshot = this.#snapshot();
    this.#options.onComplete?.(snapshot);
    this.#emitter.emit("complete", snapshot);

    this.#iteration += 1;

    if (this.#shouldRepeat()) {
      this.#completed = false;
      this.#accumulatedElapsed = this.#options.initialElapsed;
      this.#running = true;
      this.#startedAt = this.#clock.now();
      this.#startSchedule();
      this.#emitTick();
      return;
    }

    this.#emitTick();
  }

  #shouldRepeat(): boolean {
    const repeat = this.#options.repeat;
    if (repeat === true) {
      return true;
    }
    if (typeof repeat === "number") {
      return this.#iteration < repeat;
    }
    return false;
  }

  #emitTick(): void {
    const snapshot = this.#snapshot();
    this.#options.onTick?.(snapshot);
    this.#emitter.emit("tick", snapshot);
  }
}

/** Creates a headless timer controller. */
export function createTimer(options?: CreateTimerOptions): TimerControllerImpl {
  const controller = new TimerControllerImpl(options);
  controller.mount();
  return controller;
}

type WritableTimerView = Writable<TimerReactiveShape>;

interface TimerReactiveShape extends TimerController {
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
}

/** Builds a reactive-friendly timer view backed by the controller. */
export function buildReactiveTimerView(controller: TimerControllerImpl): TimerReactiveShape {
  const view: WritableTimerView = {
    id: controller.id,
    direction: controller.direction,
    running: controller.running,
    paused: controller.paused,
    completed: controller.completed,
    elapsed: controller.elapsed,
    remaining: controller.remaining,
    duration: controller.duration,
    progress: controller.progress,
    formatted: controller.formatted,
    iteration: controller.iteration,
    isMounted: controller.isMounted,
    isDestroyed: controller.isDestroyed,
    start() {
      controller.start();
      syncReactiveTimerView(view, controller);
    },
    pause() {
      controller.pause();
      syncReactiveTimerView(view, controller);
    },
    resume() {
      controller.resume();
      syncReactiveTimerView(view, controller);
    },
    toggle() {
      controller.toggle();
      syncReactiveTimerView(view, controller);
    },
    reset() {
      controller.reset();
      syncReactiveTimerView(view, controller);
    },
    restart() {
      controller.restart();
      syncReactiveTimerView(view, controller);
    },
    dispose() {
      controller.dispose();
      syncReactiveTimerView(view, controller);
    },
  };

  return view;
}

export function syncReactiveTimerView(
  view: WritableTimerView,
  controller: TimerControllerImpl
): void {
  const snapshot = controller.snapshot();
  view.running = snapshot.running;
  view.paused = snapshot.paused;
  view.completed = snapshot.completed;
  view.elapsed = snapshot.elapsed;
  view.remaining = snapshot.remaining;
  view.duration = snapshot.duration;
  view.progress = snapshot.progress;
  view.formatted = snapshot.formatted;
  view.iteration = snapshot.iteration;
  view.isMounted = controller.isMounted;
  view.isDestroyed = controller.isDestroyed;
}
