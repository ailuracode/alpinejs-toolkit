export type AccordionMode = "single" | "multiple";

export type AccordionItem = {
  id: string;
  disabled: boolean;
};

export type AccordionGroupOptions = {
  mode?: AccordionMode;
  /** Item id or ids open on init. In `single` mode only the first id is used. */
  defaultOpen?: string | string[];
  onChange?: (openIds: string[]) => void;
};

export type AccordionGroup = {
  mode: AccordionMode;
  open: Record<string, boolean>;
  activeItemId: string | null;
  items: AccordionItem[];
  defaultOpen: string[];
  onChange?: (openIds: string[]) => void;
};

export type AccordionStore = {
  /** Reactive registry of accordion groups. */
  groups: Record<string, AccordionGroup>;
  register(accordionId: string, options?: AccordionGroupOptions): void;
  unregister(accordionId: string): void;
  registerItem(accordionId: string, itemId: string, disabled?: boolean): void;
  unregisterItem(accordionId: string, itemId: string): void;
  open(accordionId: string, itemId: string): void;
  close(accordionId: string, itemId: string): void;
  toggle(accordionId: string, itemId: string): void;
  isOpen(accordionId: string, itemId: string): boolean;
  openIds(accordionId: string): string[];
  activeItem(accordionId: string): string | null;
  setActiveItem(accordionId: string, itemId: string | null): void;
  handleKeydown(accordionId: string, event: KeyboardEvent): void;
  triggerProps(
    accordionId: string,
    itemId: string
  ): Record<string, string | number | boolean | undefined>;
  panelProps(accordionId: string, itemId: string): Record<string, string | boolean | undefined>;
  destroy(): void;
};

function enabledItems(group: AccordionGroup): AccordionItem[] {
  return group.items.filter((item) => !item.disabled);
}

function itemIndex(group: AccordionGroup, itemId: string): number {
  return enabledItems(group).findIndex((item) => item.id === itemId);
}

function notify(group: AccordionGroup): void {
  group.onChange?.(
    Object.entries(group.open)
      .filter(([, isOpen]) => isOpen)
      .map(([id]) => id)
  );
}

function normalizeDefaultOpen(mode: AccordionMode, value?: string | string[]): string[] {
  if (!value) {
    return [];
  }

  const ids = Array.isArray(value) ? value : [value];
  return mode === "single" && ids.length > 0 ? [ids[0]] : ids;
}

function createGroup(options: AccordionGroupOptions = {}): AccordionGroup {
  const mode = options.mode ?? "single";
  return {
    mode,
    open: {},
    activeItemId: null,
    items: [],
    defaultOpen: normalizeDefaultOpen(mode, options.defaultOpen),
    onChange: options.onChange,
  };
}

/** Creates the headless accordion store. */
export function createAccordionStore(): AccordionStore {
  function getOrCreate(store: AccordionStore, accordionId: string): AccordionGroup {
    store.groups[accordionId] ??= createGroup();
    return store.groups[accordionId];
  }

  const store: AccordionStore = {
    groups: {},

    register(accordionId, options = {}) {
      this.groups[accordionId] = createGroup(options);
    },

    unregister(accordionId) {
      delete this.groups[accordionId];
    },

    registerItem(accordionId, itemId, disabled = false) {
      const group = getOrCreate(this, accordionId);
      const existing = group.items.find((item) => item.id === itemId);
      if (existing) {
        existing.disabled = disabled;
        return;
      }
      group.items.push({ id: itemId, disabled });

      if (group.defaultOpen.includes(itemId) && !disabled) {
        this.open(accordionId, itemId);
        group.activeItemId ??= itemId;
      }
    },

    unregisterItem(accordionId, itemId) {
      const group = this.groups[accordionId];
      if (!group) {
        return;
      }

      group.items = group.items.filter((item) => item.id !== itemId);
      delete group.open[itemId];
    },

    open(accordionId, itemId) {
      const group = this.groups[accordionId];
      const item = group?.items.find((entry) => entry.id === itemId);
      if (!(group && item) || item.disabled) {
        return;
      }

      if (group.mode === "single") {
        for (const id of Object.keys(group.open)) {
          if (group.open[id]) {
            group.open[id] = false;
          }
        }
        group.open[itemId] = true;
      } else {
        group.open[itemId] = true;
      }

      notify(group);
    },

    close(accordionId, itemId) {
      const group = this.groups[accordionId];
      if (!group?.open[itemId]) {
        return;
      }

      group.open[itemId] = false;
      notify(group);
    },

    toggle(accordionId, itemId) {
      if (this.isOpen(accordionId, itemId)) {
        this.close(accordionId, itemId);
      } else {
        this.open(accordionId, itemId);
      }
    },

    isOpen(accordionId, itemId) {
      return this.groups[accordionId]?.open[itemId] ?? false;
    },

    openIds(accordionId) {
      const open = this.groups[accordionId]?.open ?? {};
      return Object.entries(open)
        .filter(([, isOpen]) => isOpen)
        .map(([id]) => id);
    },

    activeItem(accordionId) {
      return this.groups[accordionId]?.activeItemId ?? null;
    },

    setActiveItem(accordionId, itemId) {
      const group = this.groups[accordionId];
      if (!group) {
        return;
      }

      if (itemId === null) {
        group.activeItemId = null;
        return;
      }

      const item = group.items.find((entry) => entry.id === itemId);
      if (item && !item.disabled) {
        group.activeItemId = itemId;
      }
    },

    handleKeydown(accordionId, event) {
      const group = this.groups[accordionId];
      if (!group) {
        return;
      }

      const items = enabledItems(group);
      if (items.length === 0) {
        return;
      }

      if (!group.activeItemId) {
        group.activeItemId = items[0]?.id ?? null;
      }

      const currentIndex = group.activeItemId ? itemIndex(group, group.activeItemId) : 0;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          group.activeItemId = items[(currentIndex + 1) % items.length]?.id ?? null;
          break;
        case "ArrowUp":
          event.preventDefault();
          group.activeItemId = items[(currentIndex - 1 + items.length) % items.length]?.id ?? null;
          break;
        case "Home":
          event.preventDefault();
          group.activeItemId = items[0]?.id ?? null;
          break;
        case "End":
          event.preventDefault();
          group.activeItemId = items[items.length - 1]?.id ?? null;
          break;
        default:
          break;
      }
    },

    triggerProps(accordionId, itemId) {
      const open = this.isOpen(accordionId, itemId);
      const active = this.activeItem(accordionId) === itemId;
      return {
        "aria-expanded": open,
        "aria-controls": `${accordionId}-panel-${itemId}`,
        id: `${accordionId}-trigger-${itemId}`,
        tabindex: active ? 0 : -1,
      };
    },

    panelProps(accordionId, itemId) {
      const open = this.isOpen(accordionId, itemId);
      return {
        id: `${accordionId}-panel-${itemId}`,
        role: "region",
        "aria-labelledby": `${accordionId}-trigger-${itemId}`,
        "aria-hidden": open ? undefined : true,
      };
    },

    destroy() {
      this.groups = {};
    },
  };

  return store;
}
