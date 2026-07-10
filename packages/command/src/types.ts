/**
 * Public type contracts for `@ailuracode/alpine-command`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Action callback invoked when a command is executed. */
export type CommandAction = () => void | Promise<void>;

/** A registered command item. */
export type CommandItem = {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  keywords?: string[];
  disabled?: boolean;
  action: CommandAction;
};

/** Config callbacks for the command palette. */
export type CommandStoreConfig = {
  onOpen?: () => void;
  onClose?: () => void;
  onRun?: (item: CommandItem) => void;
  filter?: (item: CommandItem, search: string) => boolean;
};

/** Options accepted by the command plugin factory. */
export interface CommandPluginOptions extends CommandStoreConfig {
  readonly id?: string;
}

/** Alpine-facing store surface. */
export interface CommandStore {
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
}

/** Typed view of `Alpine` the command plugin uses internally. */
export type CommandAlpine = Alpine<{ command: CommandStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type CommandPluginCallback = PluginCallback<AlpineBase>;
