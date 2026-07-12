/**
 * Command palette controller — the framework-agnostic core of
 * `@ailuracode/alpine-command`.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import { isEditableTarget, isTypingKey } from "./editable.js";
import { CommandError } from "./errors.js";
import type { CommandEvents } from "./events.js";
import { DEFAULT_MAX_RECENT, normalizeCommandOptions, ROOT_PAGE_ID } from "./options.js";
import { resolvePredicate } from "./predicates.js";
import { firstSelectableIndex, lastSelectableIndex, moveSelectableIndex } from "./selection.js";
import type {
  CommandExecutionState,
  CommandItem,
  CommandItemState,
  CommandPage,
  CommandStore,
  CommandStoreConfig,
  NormalizedCommandOptions,
} from "./types.js";

function belongsToPage(item: CommandItem, pageId: string): boolean {
  const itemPage = item.page ?? ROOT_PAGE_ID;
  return itemPage === pageId;
}

function isItemHidden(item: CommandItem): boolean {
  return resolvePredicate(item.hidden, false);
}

function isItemDisabled(item: CommandItem): boolean {
  if (isItemHidden(item)) {
    return true;
  }
  if (item.enabled !== undefined) {
    return !resolvePredicate(item.enabled, true);
  }
  return resolvePredicate(item.disabled, false);
}

/**
 * Headless command palette controller with search ranking, nested pages,
 * async loading/execution, and ARIA helpers.
 */
export class CommandController extends BaseController<CommandEvents> {
  readonly #options: NormalizedCommandOptions;
  readonly #items: Record<string, CommandItem> = {};
  readonly #pages: Record<string, CommandPage> = {
    [ROOT_PAGE_ID]: { id: ROOT_PAGE_ID, title: "Commands" },
  };
  readonly #loadingIds = new Set<string>();
  readonly #loadedIds = new Set<string>();
  readonly #pinnedIds = new Set<string>();
  readonly #recentIds: string[] = [];

  #search = "";
  #activeIndex = 0;
  #visible = false;
  #pageStack: string[] = [ROOT_PAGE_ID];
  #executionState: CommandExecutionState = "idle";
  #runningId: string | null = null;
  #runGeneration = 0;
  #loadGeneration = 0;
  #persistenceLoaded = false;

  constructor(id?: string, config: CommandStoreConfig = {}) {
    super(id ?? generateId("command"));
    this.#options = normalizeCommandOptions(config);
  }

  get items(): Readonly<Record<string, CommandItem>> {
    return this.#items;
  }

  get search(): string {
    return this.#search;
  }

  set search(value: string) {
    if (this.#search === value) {
      return;
    }
    this.#search = value;
    this.#activeIndex = 0;
    this.#notifyChange();
  }

  get activeIndex(): number {
    return this.#activeIndex;
  }

  set activeIndex(value: number) {
    const clamped = Math.max(0, value);
    if (this.#activeIndex === clamped) {
      return;
    }
    this.#activeIndex = clamped;
    this.#notifyChange();
  }

  get visible(): boolean {
    return this.#visible;
  }

  get isOpen(): boolean {
    return this.#visible;
  }

  get executionState(): CommandExecutionState {
    return this.#executionState;
  }

  get runningId(): string | null {
    return this.#runningId;
  }

  get currentPageId(): string {
    return this.#pageStack[this.#pageStack.length - 1] ?? ROOT_PAGE_ID;
  }

  get pageStack(): readonly string[] {
    return this.#pageStack;
  }

  get pages(): Readonly<Record<string, CommandPage>> {
    return this.#pages;
  }

  get loadingIds(): readonly string[] {
    return [...this.#loadingIds];
  }

  get pinnedIds(): readonly string[] {
    return [...this.#pinnedIds];
  }

  get recentIds(): readonly string[] {
    return [...this.#recentIds];
  }

  get visibleItems(): readonly CommandItemState[] {
    return this.#buildVisibleItems();
  }

  get filteredItems(): CommandItem[] {
    return this.visibleItems.map((entry) => entry.item);
  }

  get groupedItems(): Record<string, CommandItem[]> {
    const groups: Record<string, CommandItem[]> = {};
    for (const entry of this.visibleItems) {
      const group = entry.item.group ?? "General";
      groups[group] ??= [];
      groups[group].push(entry.item);
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
    void this.#ensurePersistenceLoaded();
    void this.#ensureCurrentPageLoaded();
    this.#options.onOpen?.();
    this.emit("open", undefined);
    this.#notifyChange();
  }

  close(): void {
    if (this.isDestroyed || !this.#visible) {
      return;
    }
    this.#visible = false;
    this.#search = "";
    this.#activeIndex = 0;
    this.#pageStack = [ROOT_PAGE_ID];
    this.cancelRun();
    this.#options.onClose?.();
    this.emit("close", undefined);
    this.#notifyChange();
  }

  toggle(): void {
    if (this.#visible) {
      this.close();
    } else {
      this.open();
    }
  }

  register(item: CommandItem): () => void {
    if (this.isDestroyed) {
      throw new CommandError("Cannot register command after destroy()", "COMMAND_DESTROYED");
    }
    if (this.#items[item.id]) {
      throw new CommandError(
        `Command id "${item.id}" is already registered`,
        "COMMAND_DUPLICATE_ID"
      );
    }

    this.#items[item.id] = item;
    if (item.pinned) {
      this.#pinnedIds.add(item.id);
    }
    this.#clampActiveIndex();
    this.#notifyChange();

    return () => {
      this.unregister(item.id);
    };
  }

  unregister(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    delete this.#items[id];
    this.#loadingIds.delete(id);
    this.#loadedIds.delete(id);
    this.#pinnedIds.delete(id);
    const recentIndex = this.#recentIds.indexOf(id);
    if (recentIndex !== -1) {
      this.#recentIds.splice(recentIndex, 1);
    }
    this.#clampActiveIndex();
    this.#notifyChange();
  }

  async pushPage(page: CommandPage): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.#pages[page.id] = page;
    this.#pageStack.push(page.id);
    this.#search = "";
    this.#activeIndex = 0;
    await this.#loadPage(page);
    this.#notifyChange();
  }

  popPage(): void {
    if (this.isDestroyed || this.#pageStack.length <= 1) {
      return;
    }
    this.#pageStack.pop();
    this.#search = "";
    this.#activeIndex = 0;
    this.#clampActiveIndex();
    this.#notifyChange();
  }

  goBack(): void {
    this.popPage();
  }

  itemState(id: string): CommandItemState | null {
    return this.visibleItems.find((entry) => entry.id === id) ?? null;
  }

  inputProps(): Record<string, string | boolean | undefined> {
    const listboxId = `${this.#options.idPrefix}-listbox`;
    const active = this.visibleItems[this.#activeIndex];
    return {
      role: "combobox",
      "aria-expanded": this.#visible,
      "aria-controls": listboxId,
      "aria-activedescendant": active ? `${this.#options.idPrefix}-option-${active.id}` : undefined,
      "aria-autocomplete": "list",
    };
  }

  listboxProps(): Record<string, string | boolean | undefined> {
    return {
      role: "listbox",
      id: `${this.#options.idPrefix}-listbox`,
      "aria-label": this.#pages[this.currentPageId]?.title ?? "Commands",
    };
  }

  optionProps(id: string): Record<string, string | number | boolean | undefined> {
    const state = this.itemState(id);
    const index = this.visibleItems.findIndex((entry) => entry.id === id);
    return {
      role: "option",
      id: `${this.#options.idPrefix}-option-${id}`,
      "aria-selected": index === this.#activeIndex,
      "aria-disabled": state?.disabled ?? false,
      "data-disabled": state?.disabled ?? false,
      "data-loading": state?.loading ?? false,
    };
  }

  cancelRun(): void {
    this.#runGeneration++;
    this.#runningId = null;
    this.#executionState = "idle";
    this.#notifyChange();
  }

  async run(id: string): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    const state = this.itemState(id) ?? this.#resolveRegisteredState(id);
    if (!state || state.disabled || state.loading) {
      return;
    }

    const generation = ++this.#runGeneration;
    this.#runningId = id;
    this.#executionState = "running";
    this.#notifyChange();

    try {
      await state.item.action();
      if (generation !== this.#runGeneration || this.isDestroyed) {
        return;
      }
      this.#options.onRun?.(state.item);
      this.emit("run", state.item);
      await this.#recordRecent(id);
      if (this.#options.closeOnRun) {
        this.close();
        return;
      }
    } finally {
      if (generation === this.#runGeneration) {
        this.#runningId = null;
        this.#executionState = "idle";
        this.#notifyChange();
      }
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.isDestroyed || !this.#visible) {
      return;
    }

    if (event.key === "Backspace" && this.#pageStack.length > 1 && this.#search.length === 0) {
      event.preventDefault();
      this.popPage();
      return;
    }

    if (!isEditableTarget(event, this.#options.editableSelector)) {
      if (event.key === "Backspace") {
        event.preventDefault();
        this.#search = this.#search.slice(0, -1);
        this.#activeIndex = 0;
        this.#notifyChange();
        return;
      }
      if (isTypingKey(event)) {
        event.preventDefault();
        this.#search += event.key;
        this.#activeIndex = 0;
        this.#notifyChange();
        return;
      }
    }

    const visible = this.visibleItems;
    const selectable = visible.map((entry) => entry.selectable);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#activeIndex = moveSelectableIndex(this.#activeIndex, 1, selectable);
        this.#notifyChange();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#activeIndex = moveSelectableIndex(this.#activeIndex, -1, selectable);
        this.#notifyChange();
        break;
      case "Home":
        event.preventDefault();
        this.#activeIndex = firstSelectableIndex(selectable);
        this.#notifyChange();
        break;
      case "End":
        event.preventDefault();
        this.#activeIndex = lastSelectableIndex(selectable);
        this.#notifyChange();
        break;
      case "Enter": {
        event.preventDefault();
        const active = visible[this.#activeIndex];
        if (active?.selectable) {
          void this.run(active.id);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        if (this.#pageStack.length > 1) {
          this.popPage();
        } else {
          this.close();
        }
        break;
      default:
        break;
    }
  }

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
      get executionState() {
        return controller.executionState;
      },
      get runningId() {
        return controller.runningId;
      },
      get currentPageId() {
        return controller.currentPageId;
      },
      get pageStack() {
        return controller.pageStack;
      },
      get pages() {
        return controller.pages;
      },
      get loadingIds() {
        return controller.loadingIds;
      },
      get pinnedIds() {
        return controller.pinnedIds;
      },
      get recentIds() {
        return controller.recentIds;
      },
      open: () => controller.open(),
      close: () => controller.close(),
      toggle: () => controller.toggle(),
      register: (item) => controller.register(item),
      unregister: (id) => controller.unregister(id),
      run: (id) => controller.run(id),
      cancelRun: () => controller.cancelRun(),
      handleKeydown: (event) => controller.handleKeydown(event),
      pushPage: (page) => controller.pushPage(page),
      popPage: () => controller.popPage(),
      goBack: () => controller.goBack(),
      itemState: (id) => controller.itemState(id),
      inputProps: () => controller.inputProps(),
      listboxProps: () => controller.listboxProps(),
      optionProps: (id) => controller.optionProps(id),
      get filteredItems() {
        return controller.filteredItems;
      },
      get visibleItems() {
        return controller.visibleItems;
      },
      get groupedItems() {
        return controller.groupedItems;
      },
      destroy: () => controller.destroy(),
    };
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.cancelRun();
    this.#loadGeneration++;
    for (const id of Object.keys(this.#items)) {
      delete this.#items[id];
    }
    for (const id of Object.keys(this.#pages)) {
      if (id !== ROOT_PAGE_ID) {
        delete this.#pages[id];
      }
    }
    this.#pageStack = [ROOT_PAGE_ID];
    this.#loadingIds.clear();
    this.#loadedIds.clear();
    this.#pinnedIds.clear();
    this.#recentIds.length = 0;
    this.#visible = false;
    this.#search = "";
    this.#activeIndex = 0;
    super.destroy();
  }

  #buildVisibleItems(): CommandItemState[] {
    const pageId = this.currentPageId;
    const ranked: CommandItemState[] = [];

    for (const item of Object.values(this.#items)) {
      if (!belongsToPage(item, pageId) || isItemHidden(item)) {
        continue;
      }

      const rank = this.#options.rank(item, this.#search);
      if (rank === null) {
        continue;
      }

      const disabled = isItemDisabled(item);
      const pinned = item.pinned === true || this.#pinnedIds.has(item.id);
      const recent = this.#recentIds.includes(item.id);
      ranked.push({
        id: item.id,
        item,
        disabled,
        hidden: false,
        loading: this.#loadingIds.has(item.id),
        pinned,
        recent,
        rank: rank + (pinned ? 1_000 : 0) + (recent ? 100 : 0),
        selectable: !(disabled || this.#loadingIds.has(item.id)),
      });

      if (item.load && !this.#loadedIds.has(item.id) && !this.#loadingIds.has(item.id)) {
        void this.#loadItem(item);
      }
    }

    ranked.sort((left, right) => {
      if (right.rank !== left.rank) {
        return right.rank - left.rank;
      }
      return left.item.label.localeCompare(right.item.label);
    });

    return ranked;
  }

  #resolveRegisteredState(id: string): CommandItemState | null {
    const item = this.#items[id];
    if (!(item && belongsToPage(item, this.currentPageId)) || isItemHidden(item)) {
      return null;
    }
    const disabled = isItemDisabled(item);
    return {
      id,
      item,
      disabled,
      hidden: false,
      loading: this.#loadingIds.has(id),
      pinned: item.pinned === true || this.#pinnedIds.has(id),
      recent: this.#recentIds.includes(id),
      rank: 0,
      selectable: !(disabled || this.#loadingIds.has(id)),
    };
  }

  async #ensurePersistenceLoaded(): Promise<void> {
    if (this.#persistenceLoaded) {
      return;
    }
    this.#persistenceLoaded = true;

    const pinned = await this.#options.persistence.getPinned?.();
    if (pinned) {
      for (const id of pinned) {
        this.#pinnedIds.add(id);
      }
    }

    const recent = await this.#options.persistence.getRecent?.();
    if (recent) {
      this.#recentIds.splice(0, this.#recentIds.length, ...recent);
    }
    this.#notifyChange();
  }

  async #ensureCurrentPageLoaded(): Promise<void> {
    const page = this.#pages[this.currentPageId];
    if (page) {
      await this.#loadPage(page);
    }
  }

  async #loadPage(page: CommandPage): Promise<void> {
    if (!page.load || this.#loadedIds.has(page.id)) {
      return;
    }

    const generation = ++this.#loadGeneration;
    this.#loadingIds.add(page.id);
    this.#executionState = "loading";
    this.#notifyChange();

    try {
      await page.load();
      if (generation !== this.#loadGeneration || this.isDestroyed) {
        return;
      }
      this.#loadedIds.add(page.id);
    } finally {
      this.#loadingIds.delete(page.id);
      if (this.#loadingIds.size === 0 && this.#executionState === "loading") {
        this.#executionState = "idle";
      }
      this.#notifyChange();
    }
  }

  async #loadItem(item: CommandItem): Promise<void> {
    if (!item.load || this.#loadedIds.has(item.id)) {
      return;
    }

    const generation = ++this.#loadGeneration;
    this.#loadingIds.add(item.id);
    this.#notifyChange();

    try {
      await item.load();
      if (generation !== this.#loadGeneration || this.isDestroyed) {
        return;
      }
      this.#loadedIds.add(item.id);
    } finally {
      this.#loadingIds.delete(item.id);
      this.#notifyChange();
    }
  }

  async #recordRecent(id: string): Promise<void> {
    const maxRecent = this.#options.persistence.maxRecent ?? DEFAULT_MAX_RECENT;
    const next = [id, ...this.#recentIds.filter((entry) => entry !== id)].slice(0, maxRecent);
    this.#recentIds.splice(0, this.#recentIds.length, ...next);
    await this.#options.persistence.setRecent?.(next);
    this.#notifyChange();
  }

  #clampActiveIndex(): void {
    const length = this.visibleItems.length;
    if (this.#activeIndex >= length) {
      this.#activeIndex = Math.max(length - 1, 0);
    }
  }

  #notifyChange(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#clampActiveIndex();
    this.emit("change", undefined);
  }
}

/** Creates a CommandController instance. */
export function createCommandController(config: CommandStoreConfig = {}): CommandController {
  return new CommandController(undefined, config);
}

/** Creates a CommandStore (store-shaped object) directly. */
export function createCommandStore(config: CommandStoreConfig = {}): CommandStore {
  return new CommandController(undefined, config).toStore();
}

export type { CommandAction, CommandItem, CommandStore, CommandStoreConfig } from "./types.js";
