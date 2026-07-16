/**
 * Tooltip controller — the framework-agnostic core of
 * `@ailuracode/alpine-tooltip`. Manages tooltip instances with
 * open/close state, delay timers, and keyboard dismiss.
 *
 * Emits a typed `change` event on every open/close transition so
 * consumers can react programmatically.
 */

import { BaseController, generateId } from "./core-deps.js";
import type { TooltipEvents } from "./events";
import type { TooltipChangeSource, TooltipInstance, TooltipInstanceOptions } from "./types";

function createInstance(options: TooltipInstanceOptions = {}): TooltipInstance {
  return {
    open: false,
    openDelay: options.openDelay ?? 0,
    closeDelay: options.closeDelay ?? 0,
    openTimer: null,
    closeTimer: null,
    onOpen: options.onOpen,
    onClose: options.onClose,
  };
}

function clearTimer(timer: ReturnType<typeof setTimeout> | null): void {
  if (timer) {
    clearTimeout(timer);
  }
}

function snapshotTooltipInstance(instance: TooltipInstance): TooltipInstance {
  return { ...instance };
}

/**
 * Headless tooltip controller. Manages multiple tooltip instances
 * with open/close state, delay timers, and keyboard dismiss.
 */
export class TooltipController extends BaseController<TooltipEvents> {
  #instances: Record<string, TooltipInstance> = {};
  #instanceCleanups: Map<string, () => void> = new Map();

  constructor(id?: string) {
    super(id ?? generateId("tooltip"));
  }

  /** Whether a tooltip instance is registered. */
  hasInstance(id: string): boolean {
    return id in this.#instances;
  }

  /**
   * Returns a shallow snapshot of all instances for adapter sync.
   * Mutating the returned objects does not affect controller state.
   */
  snapshotInstances(): Record<string, TooltipInstance> {
    const result: Record<string, TooltipInstance> = {};
    for (const [id, instance] of Object.entries(this.#instances)) {
      result[id] = snapshotTooltipInstance(instance);
    }
    return result;
  }

  /** Number of per-instance cleanup callbacks (exposed for testing). */
  get instanceCleanupCount(): number {
    return this.#instanceCleanups.size;
  }

  register(id: string, options: TooltipInstanceOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    this.#instances[id] = createInstance(options);
  }

  unregister(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#instances[id];
    if (instance) {
      clearTimer(instance.openTimer);
      clearTimer(instance.closeTimer);
    }
    this.#disposeCleanup(id);
    delete this.#instances[id];
  }

  open(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(id);
    clearTimer(instance.closeTimer);
    instance.closeTimer = null;

    const openNow = () => {
      if (this.isDestroyed || !this.#instances[id]) {
        return;
      }
      if (instance.open) {
        return;
      }
      instance.open = true;
      instance.onOpen?.();
      this.#disposeCleanup(id);
      this.#emitChange(id, "user");
    };

    if (instance.openDelay > 0) {
      instance.openTimer = setTimeout(openNow, instance.openDelay);
      this.#setCleanup(id, () => clearTimer(instance.openTimer));
      return;
    }

    openNow();
  }

  close(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#instances[id];
    if (!instance) {
      return;
    }

    clearTimer(instance.openTimer);
    instance.openTimer = null;

    const closeNow = () => {
      if (this.isDestroyed || !this.#instances[id]) {
        return;
      }
      if (!instance.open) {
        return;
      }
      instance.open = false;
      instance.onClose?.();
      this.#disposeCleanup(id);
      this.#emitChange(id, "user");
    };

    if (instance.closeDelay > 0) {
      instance.closeTimer = setTimeout(closeNow, instance.closeDelay);
      this.#setCleanup(id, () => clearTimer(instance.closeTimer));
      return;
    }

    closeNow();
  }

  toggle(id: string): void {
    if (this.isOpen(id)) {
      this.close(id);
    } else {
      this.open(id);
    }
  }

  isOpen(id: string): boolean {
    return this.#instances[id]?.open ?? false;
  }

  showOnHover(id: string): void {
    this.open(id);
  }

  hideOnHover(id: string): void {
    this.close(id);
  }

  showOnFocus(id: string): void {
    this.open(id);
  }

  hideOnFocus(id: string): void {
    this.close(id);
  }

  handleKeydown(id: string, event: KeyboardEvent): void {
    if (event.key === "Escape" && this.isOpen(id)) {
      event.preventDefault();
      this.close(id);
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    for (const instance of Object.values(this.#instances)) {
      clearTimer(instance.openTimer);
      clearTimer(instance.closeTimer);
    }

    this.#instanceCleanups.clear();
    for (const id of Object.keys(this.#instances)) {
      delete this.#instances[id];
    }
    super.destroy();
  }

  #setCleanup(id: string, cleanup: () => void): void {
    this.#disposeCleanup(id);
    this.#instanceCleanups.set(id, cleanup);
  }

  #disposeCleanup(id: string): void {
    const cleanup = this.#instanceCleanups.get(id);
    if (cleanup) {
      this.#instanceCleanups.delete(id);
      cleanup();
    }
  }

  #getOrCreate(id: string): TooltipInstance {
    this.#instances[id] ??= createInstance();
    return this.#instances[id];
  }

  #emitChange(instanceId: string, source: TooltipChangeSource): void {
    this.emit("change", {
      instanceId,
      open: this.isOpen(instanceId),
      source,
    });
  }
}

/**
 * Creates a TooltipController and returns it.
 * Convenience for non-Alpine consumers.
 */
export function createTooltipController(id?: string): TooltipController {
  return new TooltipController(id);
}
