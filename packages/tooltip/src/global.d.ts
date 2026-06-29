/// <reference types="@types/alpinejs" />

export interface TooltipStore {
  instances: Record<string, import("./store.js").TooltipInstance>;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  register(id: string, options?: import("./store.js").TooltipInstanceOptions): void;
  unregister(id: string): void;
  showOnHover(id: string): void;
  hideOnHover(id: string): void;
  showOnFocus(id: string): void;
  hideOnFocus(id: string): void;
  handleKeydown(id: string, event: KeyboardEvent): void;
  destroy(): void;
}

export function createTooltipStore(): TooltipStore;

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
