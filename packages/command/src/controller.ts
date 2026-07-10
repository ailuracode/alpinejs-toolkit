export type CommandAction = () => void | Promise<void>;

export type CommandItem = {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  keywords?: string[];
  disabled?: boolean;
  action: CommandAction;
};

export type CommandStore = {
  search: string;
  activeIndex: number;
  /** Whether the palette is visible. */
  visible: boolean;
  /** Registered command items. */
  items: Record<string, CommandItem>;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
  register(item: CommandItem): void;
  unregister(id: string): void;
  run(id: string): Promise<void>;
  handleKeydown(event: KeyboardEvent): void;
  readonly filteredItems: CommandItem[];
  readonly groupedItems: Record<string, CommandItem[]>;
  destroy(): void;
};

export type CommandStoreConfig = {
  onOpen?: () => void;
  onClose?: () => void;
  onRun?: (item: CommandItem) => void;
  filter?: (item: CommandItem, search: string) => boolean;
};

function defaultFilter(item: CommandItem, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const query = search.trim().toLowerCase();
  const haystack = [item.label, item.group ?? "", item.shortcut ?? "", ...(item.keywords ?? [])]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function isTypingKey(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.isComposing
  );
}

function handlePaletteTyping(
  store: Pick<CommandStore, "search" | "activeIndex">,
  event: KeyboardEvent
): boolean {
  if (isEditableTarget(event.target)) {
    return false;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    store.search = store.search.slice(0, -1);
    store.activeIndex = 0;
    return true;
  }

  if (isTypingKey(event)) {
    event.preventDefault();
    store.search += event.key;
    store.activeIndex = 0;
    return true;
  }

  return false;
}

/** Creates the headless command palette controller. */
export function createCommandStore(config: CommandStoreConfig = {}): CommandStore {
  const filter = config.filter ?? defaultFilter;

  const store: CommandStore = {
    search: "",
    activeIndex: 0,
    visible: false,
    items: {},

    get isOpen() {
      return this.visible;
    },

    get filteredItems() {
      const list = Object.values(this.items).filter(
        (item) => !item.disabled && filter(item, this.search)
      );
      if (this.activeIndex >= list.length) {
        this.activeIndex = Math.max(list.length - 1, 0);
      }
      return list;
    },

    get groupedItems() {
      const groups: Record<string, CommandItem[]> = {};
      for (const item of this.filteredItems) {
        const group = item.group ?? "General";
        groups[group] ??= [];
        groups[group].push(item);
      }
      return groups;
    },

    open() {
      if (this.visible) {
        return;
      }
      this.visible = true;
      this.search = "";
      this.activeIndex = 0;
      config.onOpen?.();
    },

    close() {
      if (!this.visible) {
        return;
      }
      this.visible = false;
      this.search = "";
      this.activeIndex = 0;
      config.onClose?.();
    },

    toggle() {
      if (this.visible) {
        this.close();
      } else {
        this.open();
      }
    },

    register(item) {
      this.items[item.id] = item;
    },

    unregister(id) {
      delete this.items[id];
    },

    async run(id) {
      const item = this.items[id];
      if (!item || item.disabled) {
        return;
      }

      await item.action();
      config.onRun?.(item);
      this.close();
    },

    handleKeydown(event) {
      if (!this.visible) {
        return;
      }

      const list = this.filteredItems;

      if (handlePaletteTyping(this, event)) {
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          this.activeIndex = list.length === 0 ? 0 : (this.activeIndex + 1) % list.length;
          break;
        case "ArrowUp":
          event.preventDefault();
          this.activeIndex =
            list.length === 0 ? 0 : (this.activeIndex - 1 + list.length) % list.length;
          break;
        case "Home":
          event.preventDefault();
          this.activeIndex = 0;
          break;
        case "End":
          event.preventDefault();
          this.activeIndex = Math.max(list.length - 1, 0);
          break;
        case "Enter": {
          event.preventDefault();
          const active = list[this.activeIndex];
          if (active) {
            void this.run(active.id);
          }
          break;
        }
        case "Escape":
          event.preventDefault();
          this.close();
          break;
        default:
          break;
      }
    },

    destroy() {
      this.items = {};
      this.visible = false;
      this.search = "";
      this.activeIndex = 0;
    },
  };

  return store;
}

export type CommandController = CommandStore;

/** Alias matching the controller-based architecture naming. */
export function createCommandController(config: CommandStoreConfig = {}): CommandController {
  return createCommandStore(config);
}
