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
  readonly isOpen: boolean;
  readonly executionState: CommandExecutionState;
  readonly runningId: string | null;
  readonly currentPageId: string;
  readonly pageStack: readonly string[];
  readonly pages: Readonly<Record<string, CommandPage>>;
  readonly loadingIds: readonly string[];
  readonly pinnedIds: readonly string[];
  readonly recentIds: readonly string[];
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
  readonly filteredItems: CommandItem[];
  readonly visibleItems: readonly CommandItemState[];
  readonly groupedItems: Record<string, CommandItem[]>;
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
