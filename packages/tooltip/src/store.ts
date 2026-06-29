export type TooltipInstanceOptions = {
  openDelay?: number;
  closeDelay?: number;
  onOpen?: () => void;
  onClose?: () => void;
};

export type TooltipInstance = {
  open: boolean;
  openDelay: number;
  closeDelay: number;
  openTimer: ReturnType<typeof setTimeout> | null;
  closeTimer: ReturnType<typeof setTimeout> | null;
  onOpen?: () => void;
  onClose?: () => void;
};

export type TooltipStore = {
  /** Reactive registry of tooltip instances. */
  instances: Record<string, TooltipInstance>;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  register(id: string, options?: TooltipInstanceOptions): void;
  unregister(id: string): void;
  showOnHover(id: string): void;
  hideOnHover(id: string): void;
  showOnFocus(id: string): void;
  hideOnFocus(id: string): void;
  handleKeydown(id: string, event: KeyboardEvent): void;
  destroy(): void;
};

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

/** Creates the headless tooltip store. */
export function createTooltipStore(): TooltipStore {
  function getOrCreate(store: TooltipStore, id: string): TooltipInstance {
    store.instances[id] ??= createInstance();
    return store.instances[id];
  }

  const store: TooltipStore = {
    instances: {},

    register(id, options = {}) {
      this.instances[id] = createInstance(options);
    },

    unregister(id) {
      const instance = this.instances[id];
      if (instance) {
        clearTimer(instance.openTimer);
        clearTimer(instance.closeTimer);
      }
      delete this.instances[id];
    },

    open(id) {
      const instance = getOrCreate(this, id);
      clearTimer(instance.closeTimer);
      instance.closeTimer = null;

      const openNow = () => {
        if (instance.open) {
          return;
        }
        instance.open = true;
        instance.onOpen?.();
      };

      if (instance.openDelay > 0) {
        instance.openTimer = setTimeout(openNow, instance.openDelay);
        return;
      }

      openNow();
    },

    close(id) {
      const instance = this.instances[id];
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
      };

      if (instance.closeDelay > 0) {
        instance.closeTimer = setTimeout(closeNow, instance.closeDelay);
        return;
      }

      closeNow();
    },

    toggle(id) {
      if (this.isOpen(id)) {
        this.close(id);
      } else {
        this.open(id);
      }
    },

    isOpen(id) {
      return this.instances[id]?.open ?? false;
    },

    showOnHover(id) {
      this.open(id);
    },

    hideOnHover(id) {
      this.close(id);
    },

    showOnFocus(id) {
      this.open(id);
    },

    hideOnFocus(id) {
      this.close(id);
    },

    handleKeydown(id, event) {
      if (event.key === "Escape" && this.isOpen(id)) {
        event.preventDefault();
        this.close(id);
      }
    },

    destroy() {
      for (const id of Object.keys(this.instances)) {
        this.unregister(id);
      }
    },
  };

  return store;
}
