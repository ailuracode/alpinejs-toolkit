/**
 * Public type contracts for `@ailuracode/alpine-command`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core/types";
import type { ScrollStore } from "@ailuracode/alpine-scroll";
import type { Alpine as AlpineBase } from "alpinejs";

/** Action callback invoked when a command is executed. */
export type CommandAction = () => void | Promise<void>;

/** Static or reactive predicate for command state. */
export type CommandPredicate = boolean | (() => boolean);

/** Async loader for lazy command registration. */
export type CommandLoader = () => void | Promise<void>;

/** Search ranking strategy. */
export type CommandSearchStrategy = "substring" | "fuzzy";

/** Rank function — higher scores surface earlier; `null` excludes the item. */
export type CommandRankFn = (item: CommandItem, search: string) => number | null;

/**
 * @deprecated Use {@link CommandRankFn} via `rank` or `searchStrategy` instead.
 * Legacy boolean filter kept for backward compatibility.
 */
export type CommandFilterFn = (item: CommandItem, search: string) => boolean;

/** Optional recent/pinned persistence hooks. */
export type CommandPersistence = {
  readonly maxRecent?: number;
  readonly getRecent?: () => readonly string[] | Promise<readonly string[]>;
  readonly setRecent?: (ids: readonly string[]) => void | Promise<void>;
  readonly getPinned?: () => readonly string[] | Promise<readonly string[]>;
  readonly setPinned?: (ids: readonly string[]) => void | Promise<void>;
};

/** Nested command page metadata. */
export type CommandPage = {
  readonly id: string;
  readonly title: string;
  readonly parentId?: string;
  readonly load?: CommandLoader;
};

/** A registered command item. */
export type CommandItem = {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly shortcut?: string;
  readonly keywords?: string[];
  readonly aliases?: string[];
  readonly disabled?: CommandPredicate;
  readonly hidden?: CommandPredicate;
  readonly enabled?: CommandPredicate;
  readonly pinned?: boolean;
  readonly page?: string;
  readonly load?: CommandLoader;
  readonly action: CommandAction;
};

/** Resolved runtime state for a visible command row. */
export type CommandItemState = {
  readonly id: string;
  readonly item: CommandItem;
  readonly disabled: boolean;
  readonly hidden: boolean;
  readonly loading: boolean;
  readonly pinned: boolean;
  readonly recent: boolean;
  readonly rank: number;
  readonly selectable: boolean;
};

/** Explicit async lifecycle state for the palette. */
export type CommandExecutionState = "idle" | "loading" | "running";

/** Config callbacks and behavior for the command palette. */
export type CommandStoreConfig = {
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly onRun?: (item: CommandItem) => void;
  /** @deprecated Use `rank` or `searchStrategy` instead. */
  readonly filter?: CommandFilterFn;
  readonly rank?: CommandRankFn;
  readonly searchStrategy?: CommandSearchStrategy;
  readonly persistence?: CommandPersistence;
  readonly overlayId?: string;
  readonly editableSelector?: string;
  readonly idPrefix?: string;
  readonly closeOnRun?: boolean;
  readonly scroll?: ScrollStore;
  readonly scrollLock?: boolean;
};

/** Normalized options used internally by the controller. */
export type NormalizedCommandOptions = {
  readonly id?: string;
  readonly onOpen?: () => void;
  readonly onClose?: () => void;
  readonly onRun?: (item: CommandItem) => void;
  readonly rank: CommandRankFn;
  readonly searchStrategy: CommandSearchStrategy;
  readonly persistence: Required<Pick<CommandPersistence, "maxRecent">> &
    Omit<CommandPersistence, "maxRecent">;
  readonly overlayId?: string;
  readonly editableSelector: string;
  readonly idPrefix: string;
  readonly closeOnRun: boolean;
  readonly scroll?: ScrollStore;
  readonly scrollLock: boolean;
};

/** Options accepted by the command plugin factory. */
export interface CommandPluginOptions extends CommandStoreConfig {
  readonly id?: string;
  /**
   * `$store` key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_COMMAND_STORE_KEY}. Set when the host already owns
   * a `command` store or another toolkit plugin would collide on that
   * name — the rename avoids the collision without touching the
   * controller. Ignored by the standalone `createCommandStore` factory.
   */
  readonly storeKey?: string;
  /**
   * `$command` magic key the Alpine plugin registers under. Defaults
   * to {@link DEFAULT_COMMAND_MAGIC_KEY}, or to `storeKey` when that
   * is renamed (the magic follows the store so consumers only rename
   * one). Ignored by the standalone factory.
   */
  readonly magicKey?: string;
}

/** Default `$store` key registered by {@link commandPlugin}. */
export const DEFAULT_COMMAND_STORE_KEY = "command";

/** Default `$command` magic key registered by {@link commandPlugin}. */
export const DEFAULT_COMMAND_MAGIC_KEY = "command";

/** Alpine-facing store surface. */
export interface CommandStore {
  search: string;
  activeIndex: number;
  visible: boolean;
  items: Record<string, CommandItem>;
  isOpen: boolean;
  executionState: CommandExecutionState;
  runningId: string | null;
  currentPageId: string;
  pageStack: string[];
  pages: Record<string, CommandPage>;
  loadingIds: string[];
  pinnedIds: string[];
  recentIds: string[];
  open(): void;
  close(): void;
  toggle(): void;
  register(item: CommandItem): () => void;
  unregister(id: string): void;
  run(id: string): Promise<void>;
  cancelRun(): void;
  handleKeydown(event: KeyboardEvent): void;
  pushPage(page: CommandPage): Promise<void>;
  popPage(): void;
  goBack(): void;
  itemState(id: string): CommandItemState | null;
  inputProps(): Record<string, string | boolean | undefined>;
  listboxProps(): Record<string, string | boolean | undefined>;
  optionProps(id: string): Record<string, string | number | boolean | undefined>;
  filteredItems: CommandItem[];
  visibleItems: CommandItemState[];
  groupedItems: Record<string, CommandItem[]>;
  destroy(): void;
}

/** Typed view of `Alpine` the command plugin uses internally. */
export type CommandAlpine = Alpine<{ command: CommandStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type CommandPluginCallback = PluginCallback<AlpineBase>;
