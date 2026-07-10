/// <reference types="@types/alpinejs" />

import type { TooltipInstance, TooltipInstanceOptions } from "./types";

export type {
  TooltipChangeDetail,
  TooltipChangeSource,
  TooltipInstance,
  TooltipInstanceOptions,
} from "./types";

export interface TooltipStore {
  readonly instances: Record<string, TooltipInstance>;
  register(id: string, options?: TooltipInstanceOptions): void;
  unregister(id: string): void;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  showOnHover(id: string): void;
  hideOnHover(id: string): void;
  showOnFocus(id: string): void;
  hideOnFocus(id: string): void;
  handleKeydown(id: string, event: KeyboardEvent): void;
  destroy(): void;
}

export function createTooltipController(id?: string): import("./types").TooltipController;

export default function tooltipPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      tooltip: TooltipStore;
    }
    interface Magics<T> {
      $tooltip: TooltipStore;
    }
  }
}
