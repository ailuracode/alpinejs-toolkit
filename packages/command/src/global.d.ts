/// <reference types="@types/alpinejs" />

import type { CommandItem } from "./types";

export type { CommandAction, CommandItem, CommandStoreConfig } from "./types";

export interface CommandStore {
  search: string;
  activeIndex: number;
  visible: boolean;
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
}

export function createCommandController(
  config?: import("./types").CommandStoreConfig
): import("./types").CommandController;

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
