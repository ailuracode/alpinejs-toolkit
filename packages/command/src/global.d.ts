/// <reference types="@types/alpinejs" />

import type {
  CommandExecutionState,
  CommandItem,
  CommandItemState,
  CommandPage,
  CommandStoreConfig,
} from "./types";

export type {
  CommandAction,
  CommandExecutionState,
  CommandFilterFn,
  CommandItem,
  CommandItemState,
  CommandLoader,
  CommandPage,
  CommandPersistence,
  CommandPredicate,
  CommandRankFn,
  CommandSearchStrategy,
  CommandStoreConfig,
} from "./types";

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

export function createCommandController(
  config?: CommandStoreConfig
): import("./controller").CommandController;

export default function commandPlugin(
  options?: import("./types").CommandPluginOptions
): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      command: CommandStore;
    }
    interface Magics<T> {
      $command: CommandStore;
    }
  }
}
