/**
 * Tooltip controller — the framework-agnostic core of
 * `@ailuracode/alpine-tooltip`. Manages tooltip instances with
 * open/close state, delay timers, and keyboard dismiss.
 *
 * Emits a typed `change` event on every open/close transition so
 * consumers can react programmatically.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import type { TooltipEvents } from "./events";
import type {
  TooltipChangeSource,
  TooltipInstance,
  TooltipInstanceOptions,
  TooltipStore,
} from "./types";

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

/**
 * Headless tooltip controller. Manages multiple tooltip instances
 * with open/close state, delay timers, and keyboard dismiss.
 */
export class TooltipController extends BaseController<TooltipEvents> {
  #instances: Record<string, TooltipInstance> = {};

  constructor(id?: string) {
    super(id ?? generateId("tooltip"));
  }

  get instances(): Readonly<Record<string, TooltipInstance>> {
    return this.#instances;
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
      this.registerCleanup(() => {
        clearTimer(instance.openTimer);
        clearTimer(instance.closeTimer);
      });
    }
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
      if (instance.open) {
        return;
      }
      instance.open = true;
      instance.onOpen?.();
      this.#emitChange(id, "user");
    };

    if (instance.openDelay > 0) {
      instance.openTimer = setTimeout(openNow, instance.openDelay);
      this.registerCleanup(() => clearTimer(instance.openTimer));
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
      if (!instance.open) {
        return;
      }
      instance.open = false;
      instance.onClose?.();
      this.#emitChange(id, "user");
    };

    if (instance.closeDelay > 0) {
      instance.closeTimer = setTimeout(closeNow, instance.closeDelay);
      this.registerCleanup(() => clearTimer(instance.closeTimer));
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

  /**
   * Returns a store-shaped object for Alpine's `$store.tooltip`.
   * The store delegates to this controller.
   */
  toStore(): TooltipStore {
    return {
      instances: this.#instances as Record<string, TooltipInstance>,
      register: (id, options) => this.register(id, options),
      unregister: (id) => this.unregister(id),
      open: (id) => this.open(id),
      close: (id) => this.close(id),
      toggle: (id) => this.toggle(id),
      isOpen: (id) => this.isOpen(id),
      showOnHover: (id) => this.showOnHover(id),
      hideOnHover: (id) => this.hideOnHover(id),
      showOnFocus: (id) => this.showOnFocus(id),
      hideOnFocus: (id) => this.hideOnFocus(id),
      handleKeydown: (id, event) => this.handleKeydown(id, event),
      destroy: () => this.destroy(),
    };
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

/**
 * Creates a TooltipStore (store-shaped object) directly.
 * Backward-compatible alias.
 */
export function createTooltipStore(): TooltipStore {
  return new TooltipController().toStore();
}
