/// <reference types="@types/alpinejs" />

import type { AccordionGroup, AccordionGroupOptions } from "./types";

export type { AccordionGroup, AccordionGroupOptions, AccordionMode } from "./types";

export interface AccordionStore {
  readonly groups: Record<string, AccordionGroup>;
  register(accordionId: string, options?: AccordionGroupOptions): void;
  unregister(accordionId: string): void;
  registerItem(accordionId: string, itemId: string, disabled?: boolean): void;
  unregisterItem(accordionId: string, itemId: string): void;
  open(accordionId: string, itemId: string): void;
  close(accordionId: string, itemId: string): void;
  toggle(accordionId: string, itemId: string): void;
  isOpen(accordionId: string, itemId: string): boolean;
  openIds(accordionId: string): string[];
  activeItem(accordionId: string): string | null;
  setActiveItem(accordionId: string, itemId: string | null): void;
  handleKeydown(accordionId: string, event: KeyboardEvent): void;
  triggerProps(
    accordionId: string,
    itemId: string
  ): Record<string, string | number | boolean | undefined>;
  panelProps(accordionId: string, itemId: string): Record<string, string | boolean | undefined>;
  destroy(): void;
}

export function createAccordionController(id?: string): import("./types").AccordionController;

export default function accordionPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      accordion: AccordionStore;
    }
    interface Magics<T> {
      $accordion: AccordionStore;
    }
  }
}
