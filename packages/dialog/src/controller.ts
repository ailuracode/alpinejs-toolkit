/**
 * Dialog controller — the framework-agnostic core of
 * `@ailuracode/alpine-dialog`. Manages dialog instances with
 * open/close state, focus trap, scroll lock, and keyboard handling.
 *
 * Emits typed `open` and `close` events so consumers can react
 * programmatically.
 */

import type { ScrollStore } from "@ailuracode/alpine-scroll";
import { BaseController, generateId } from "./core-deps.js";
import type { DialogEvents } from "./events";
import { createFocusTrap, type FocusTrap } from "./focus.js";
import type {
  DialogChangeSource,
  DialogInstance,
  DialogInstanceOptions,
  DialogOpenOptions,
  DialogStoreConfig,
} from "./types";

function createInstance(options: DialogInstanceOptions = {}): DialogInstance {
  return {
    open: false,
    closeOnEscape: options.closeOnEscape ?? true,
    closeOnOutsideClick: options.closeOnOutsideClick ?? true,
    scrollLock: options.scrollLock ?? true,
    labelledBy: options.labelledBy,
    describedBy: options.describedBy,
    trigger: null,
    container: null,
    onOpen: options.onOpen,
    onClose: options.onClose,
  };
}

function snapshotDialogInstance(instance: DialogInstance): DialogInstance {
  return { ...instance };
}

/**
 * Headless dialog controller. Manages multiple dialog instances with
 * open/close state, focus trap management, scroll lock, and keyboard
 * handling.
 */
export class DialogController extends BaseController<DialogEvents> {
  #instances: Record<string, DialogInstance> = {};
  #traps = new Map<string, FocusTrap>();
  #lockCount = 0;
  #lockHandle: string | null = null;
  #defaultCloseOnEscape: boolean;
  #defaultCloseOnOutsideClick: boolean;
  #defaultScrollLock: boolean;
  #scroll: ScrollStore | undefined;

  constructor(config: DialogStoreConfig = {}, id?: string) {
    super(id ?? generateId("dialog"));
    this.#defaultCloseOnEscape = config.defaultCloseOnEscape ?? true;
    this.#defaultCloseOnOutsideClick = config.defaultCloseOnOutsideClick ?? true;
    this.#defaultScrollLock = config.defaultScrollLock ?? true;
    this.#scroll = config.scroll;
  }

  /** Whether a dialog instance is registered. */
  hasInstance(id: string): boolean {
    return id in this.#instances;
  }

  /**
   * Returns a shallow snapshot of all instances for adapter sync.
   * Mutating the returned objects does not affect controller state.
   */
  snapshotInstances(): Record<string, DialogInstance> {
    const result: Record<string, DialogInstance> = {};
    for (const [id, instance] of Object.entries(this.#instances)) {
      result[id] = snapshotDialogInstance(instance);
    }
    return result;
  }

  register(id: string, options: DialogInstanceOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    this.#instances[id] = createInstance(options);
    this.#notifyChange(id);
  }

  unregister(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.isOpen(id)) {
      this.close(id);
    }
    delete this.#instances[id];
    this.#deactivateTrap(id);
    this.#notifyChange(id);
  }

  open(id: string, options: DialogOpenOptions = {}, source: DialogChangeSource = "user"): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(id);
    if (instance.open) {
      return;
    }

    instance.open = true;
    if (options.trigger !== undefined) {
      instance.trigger = options.trigger;
    }
    if (options.labelledBy !== undefined) {
      instance.labelledBy = options.labelledBy;
    }
    if (options.describedBy !== undefined) {
      instance.describedBy = options.describedBy;
    }

    if (instance.scrollLock) {
      this.#updateScrollLock(true);
    }

    this.#activateTrap(id, instance);
    instance.onOpen?.();

    this.emit("open", { instanceId: id, source });
    this.#notifyChange(id);
  }

  close(id: string, source: DialogChangeSource = "user"): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#instances[id];
    if (!instance?.open) {
      return;
    }

    instance.open = false;
    this.#deactivateTrap(id);

    if (instance.scrollLock) {
      this.#updateScrollLock(false);
    }

    instance.onClose?.();

    this.emit("close", { instanceId: id, source });
    this.#notifyChange(id);
  }

  toggle(id: string, options: DialogOpenOptions = {}): void {
    if (this.isOpen(id)) {
      this.close(id);
    } else {
      this.open(id, options);
    }
  }

  isOpen(id: string): boolean {
    return this.#instances[id]?.open ?? false;
  }

  bindContainer(id: string, container: HTMLElement | null): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(id);
    instance.container = container;

    if (instance.open && container) {
      this.#activateTrap(id, instance);
    }
  }

  handleKeydown(id: string, event: KeyboardEvent): void {
    const instance = this.#instances[id];
    if (!(instance?.open && instance.closeOnEscape)) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.close(id);
    }
  }

  handleOutsideClick(id: string, event: MouseEvent): void {
    const instance = this.#instances[id];
    if (!(instance?.open && instance.closeOnOutsideClick && instance.container)) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && !instance.container.contains(target)) {
      this.close(id);
    }
  }

  dialogProps(id: string): Record<string, string | boolean | undefined> {
    const instance = this.#instances[id];
    return {
      role: "dialog",
      "aria-modal": true,
      "aria-labelledby": instance?.labelledBy,
      "aria-describedby": instance?.describedBy,
    };
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    for (const id of Object.keys(this.#instances)) {
      this.close(id);
      delete this.#instances[id];
      this.#deactivateTrap(id);
    }
    if (this.#lockHandle !== null) {
      this.#scroll?.unlock(this.#lockHandle);
      this.#lockHandle = null;
    }
    this.#lockCount = 0;
    super.destroy();
  }

  #getOrCreate(id: string): DialogInstance {
    this.#instances[id] ??= createInstance({
      closeOnEscape: this.#defaultCloseOnEscape,
      closeOnOutsideClick: this.#defaultCloseOnOutsideClick,
      scrollLock: this.#defaultScrollLock,
    });
    return this.#instances[id];
  }

  #notifyChange(instanceId?: string): void {
    this.emit("change", { instanceId });
  }

  #updateScrollLock(locked: boolean): void {
    if (locked) {
      if (this.#lockCount === 0 && this.#scroll && this.#lockHandle === null) {
        this.#lockHandle = this.#scroll.lock("dialog");
      }
      this.#lockCount++;
      return;
    }

    if (this.#lockCount === 0) {
      return;
    }

    this.#lockCount--;
    if (this.#lockCount === 0 && this.#lockHandle !== null) {
      this.#scroll?.unlock(this.#lockHandle);
      this.#lockHandle = null;
    }
  }

  #deactivateTrap(id: string): void {
    const trap = this.#traps.get(id);
    trap?.deactivate();
    this.#traps.delete(id);
  }

  #activateTrap(id: string, instance: DialogInstance): void {
    if (!instance.container) {
      return;
    }

    this.#deactivateTrap(id);
    const trap = createFocusTrap(instance.container);
    this.#traps.set(id, trap);
    trap.activate();
  }
}

/**
 * Creates a DialogController.
 * Convenience for non-Alpine consumers.
 */
export function createDialogController(config: DialogStoreConfig = {}): DialogController {
  return new DialogController(config);
}
