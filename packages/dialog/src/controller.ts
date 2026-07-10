import { createFocusTrap, type FocusTrap } from "./focus.js";

export type DialogOpenOptions = {
  trigger?: HTMLElement | null;
  labelledBy?: string;
  describedBy?: string;
};

export type DialogInstanceOptions = {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  scrollLock?: boolean;
  labelledBy?: string;
  describedBy?: string;
  onOpen?: () => void;
  onClose?: () => void;
};

export type DialogInstance = {
  open: boolean;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
  scrollLock: boolean;
  labelledBy?: string;
  describedBy?: string;
  trigger: HTMLElement | null;
  container: HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
};

export type DialogStore = {
  /** Reactive registry — bind templates to `instances[id].open` when needed. */
  instances: Record<string, DialogInstance>;
  open(id: string, options?: DialogOpenOptions): void;
  close(id: string): void;
  toggle(id: string, options?: DialogOpenOptions): void;
  isOpen(id: string): boolean;
  register(id: string, options?: DialogInstanceOptions): void;
  unregister(id: string): void;
  bindContainer(id: string, container: HTMLElement | null): void;
  handleKeydown(id: string, event: KeyboardEvent): void;
  handleOutsideClick(id: string, event: MouseEvent): void;
  dialogProps(id: string): Record<string, string | boolean | undefined>;
  destroy(): void;
};

type DialogStoreConfig = {
  onLockChange?: (locked: boolean) => void;
  defaultCloseOnEscape?: boolean;
  defaultCloseOnOutsideClick?: boolean;
  defaultScrollLock?: boolean;
};

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

/** Creates the headless dialog controller. */
export function createDialogStore(config: DialogStoreConfig = {}): DialogStore {
  const traps = new Map<string, FocusTrap>();
  let lockCount = 0;

  const defaultCloseOnEscape = config.defaultCloseOnEscape ?? true;
  const defaultCloseOnOutsideClick = config.defaultCloseOnOutsideClick ?? true;
  const defaultScrollLock = config.defaultScrollLock ?? true;

  function setLock(locked: boolean): void {
    if (locked) {
      if (lockCount === 0) {
        config.onLockChange?.(true);
      }
      lockCount++;
      return;
    }

    if (lockCount === 0) {
      return;
    }

    lockCount--;
    if (lockCount === 0) {
      config.onLockChange?.(false);
    }
  }

  function deactivateTrap(id: string): void {
    const trap = traps.get(id);
    trap?.deactivate();
    traps.delete(id);
  }

  function activateTrap(id: string, instance: DialogInstance): void {
    if (!instance.container) {
      return;
    }

    deactivateTrap(id);
    const trap = createFocusTrap(instance.container);
    traps.set(id, trap);
    trap.activate();
  }

  function getOrCreate(store: DialogStore, id: string): DialogInstance {
    store.instances[id] ??= createInstance({
      closeOnEscape: defaultCloseOnEscape,
      closeOnOutsideClick: defaultCloseOnOutsideClick,
      scrollLock: defaultScrollLock,
    });
    return store.instances[id];
  }

  const store: DialogStore = {
    instances: {},

    register(id, options = {}) {
      this.instances[id] = createInstance(options);
    },

    unregister(id) {
      if (this.isOpen(id)) {
        this.close(id);
      }
      delete this.instances[id];
      deactivateTrap(id);
    },

    open(id, options = {}) {
      const instance = getOrCreate(this, id);
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
        setLock(true);
      }

      activateTrap(id, instance);
      instance.onOpen?.();
    },

    close(id) {
      const instance = this.instances[id];
      if (!instance?.open) {
        return;
      }

      instance.open = false;
      deactivateTrap(id);

      if (instance.scrollLock) {
        setLock(false);
      }

      instance.onClose?.();
    },

    toggle(id, options = {}) {
      if (this.isOpen(id)) {
        this.close(id);
      } else {
        this.open(id, options);
      }
    },

    isOpen(id) {
      return this.instances[id]?.open ?? false;
    },

    bindContainer(id, container) {
      const instance = getOrCreate(this, id);
      instance.container = container;

      if (instance.open && container) {
        activateTrap(id, instance);
      }
    },

    handleKeydown(id, event) {
      const instance = this.instances[id];
      if (!(instance?.open && instance.closeOnEscape)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.close(id);
      }
    },

    handleOutsideClick(id, event) {
      const instance = this.instances[id];
      if (!(instance?.open && instance.closeOnOutsideClick && instance.container)) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !instance.container.contains(target)) {
        this.close(id);
      }
    },

    dialogProps(id) {
      const instance = this.instances[id];
      return {
        role: "dialog",
        "aria-modal": true,
        "aria-labelledby": instance?.labelledBy,
        "aria-describedby": instance?.describedBy,
      };
    },

    destroy() {
      for (const id of Object.keys(this.instances)) {
        this.unregister(id);
      }
      lockCount = 0;
      config.onLockChange?.(false);
    },
  };

  return store;
}

export type DialogController = DialogStore;

/** Alias matching the controller-based architecture naming. */
export function createDialogController(config: DialogStoreConfig = {}): DialogController {
  return createDialogStore(config);
}
