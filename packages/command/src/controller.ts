/**
 * Command palette controller — the framework-agnostic core of
 * `@ailuracode/alpine-command`. Manages a singleton command palette
 * with search, item registry, open/close/toggle, keyboard navigation,
 * and filtered/grouped item views.
 *
 * Emits typed `open`, `close`, and `run` events so consumers can
 * react programmatically.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import type { CommandEvents } from "./events";
import type { CommandItem, CommandStore, CommandStoreConfig } from "./types";

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

/**
 * Headless command palette controller. Manages a singleton command palette
 * with search, item registry, open/close/toggle, keyboard navigation,
 * and filtered/grouped item views.
 */
export class CommandController extends BaseController<CommandEvents> {
  #items: Record<string, CommandItem> = {};
  #search = "";
  #activeIndex = 0;
  #visible = false;
  readonly #filter: (item: CommandItem, search: string) => boolean;
  readonly #config: CommandStoreConfig;

  constructor(id?: string, config: CommandStoreConfig = {}) {
    super(id ?? generateId("command"));
    this.#filter = config.filter ?? defaultFilter;
    this.#config = config;
  }

  get items(): Readonly<Record<string, CommandItem>> {
    return this.#items;
  }

  get search(): string {
    return this.#search;
  }

  set search(value: string) {
    this.#search = value;
  }

  get activeIndex(): number {
    return this.#activeIndex;
  }

  set activeIndex(value: number) {
    this.#activeIndex = value;
  }

  get visible(): boolean {
    return this.#visible;
  }

  get isOpen(): boolean {
    return this.#visible;
  }

  get filteredItems(): CommandItem[] {
    const list = Object.values(this.#items).filter(
      (item) => !item.disabled && this.#filter(item, this.#search)
    );
    if (this.#activeIndex >= list.length) {
      this.#activeIndex = Math.max(list.length - 1, 0);
    }
    return list;
  }

  get groupedItems(): Record<string, CommandItem[]> {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of this.filteredItems) {
      const group = item.group ?? "General";
      groups[group] ??= [];
      groups[group].push(item);
    }
    return groups;
  }

  open(): void {
    if (this.isDestroyed || this.#visible) {
      return;
    }
    this.#visible = true;
    this.#search = "";
    this.#activeIndex = 0;
    this.#config.onOpen?.();
    this.emit("open", undefined);
  }

  close(): void {
    if (this.isDestroyed || !this.#visible) {
      return;
    }
    this.#visible = false;
    this.#search = "";
    this.#activeIndex = 0;
    this.#config.onClose?.();
    this.emit("close", undefined);
  }

  toggle(): void {
    if (this.#visible) {
      this.close();
    } else {
      this.open();
    }
  }

  register(item: CommandItem): void {
    if (this.isDestroyed) {
      return;
    }
    this.#items[item.id] = item;
  }

  unregister(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    delete this.#items[id];
  }

  async run(id: string): Promise<void> {
    if (this.isDestroyed) {
      return;
    }
    const item = this.#items[id];
    if (!item || item.disabled) {
      return;
    }

    await item.action();
    this.#config.onRun?.(item);
    this.emit("run", item);
    this.close();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.isDestroyed || !this.#visible) {
      return;
    }

    const list = this.filteredItems;

    if (isEditableTarget(event.target)) {
      // Don't capture typing when an input is focused
    } else if (event.key === "Backspace") {
      event.preventDefault();
      this.#search = this.#search.slice(0, -1);
      this.#activeIndex = 0;
      return;
    } else if (isTypingKey(event)) {
      event.preventDefault();
      this.#search += event.key;
      this.#activeIndex = 0;
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#activeIndex = list.length === 0 ? 0 : (this.#activeIndex + 1) % list.length;
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#activeIndex =
          list.length === 0 ? 0 : (this.#activeIndex - 1 + list.length) % list.length;
        break;
      case "Home":
        event.preventDefault();
        this.#activeIndex = 0;
        break;
      case "End":
        event.preventDefault();
        this.#activeIndex = Math.max(list.length - 1, 0);
        break;
      case "Enter": {
        event.preventDefault();
        const active = list[this.#activeIndex];
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
  }

  /**
   * Returns a store-shaped object for Alpine's `$store.command`.
   * The store delegates to this controller.
   */
  toStore(): CommandStore {
    const controller = this;
    return {
      get search() {
        return controller.search;
      },
      set search(value) {
        controller.search = value;
      },
      get activeIndex() {
        return controller.activeIndex;
      },
      set activeIndex(value) {
        controller.activeIndex = value;
      },
      get visible() {
        return controller.visible;
      },
      get items() {
        return controller.items as Record<string, CommandItem>;
      },
      get isOpen() {
        return controller.isOpen;
      },
      open: () => controller.open(),
      close: () => controller.close(),
      toggle: () => controller.toggle(),
      register: (item) => controller.register(item),
      unregister: (id) => controller.unregister(id),
      run: (id) => controller.run(id),
      handleKeydown: (event) => controller.handleKeydown(event),
      get filteredItems() {
        return controller.filteredItems;
      },
      get groupedItems() {
        return controller.groupedItems;
      },
      destroy: () => controller.destroy(),
    };
  }
}

/**
 * Creates a CommandController instance.
 * Convenience for non-Alpine consumers.
 */
export function createCommandController(config: CommandStoreConfig = {}): CommandController {
  return new CommandController(undefined, config);
}

/**
 * Creates a CommandStore (store-shaped object) directly.
 * Backward-compatible alias.
 */
export function createCommandStore(config: CommandStoreConfig = {}): CommandStore {
  return new CommandController(undefined, config).toStore();
}

// Re-export types for backward compatibility
export type { CommandAction, CommandItem, CommandStore, CommandStoreConfig } from "./types";
