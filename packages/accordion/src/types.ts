/**
 * Public type contracts for `@ailuracode/alpine-accordion`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Accordion display mode. */
export type AccordionMode = "single" | "multiple";

/** An accordion item's registration state. */
export type AccordionItem = {
  id: string;
  disabled: boolean;
};

/** Options passed when registering an accordion group. */
export type AccordionGroupOptions = {
  readonly mode?: AccordionMode;
  /** Item id or ids open on init. In `single` mode only the first id is used. */
  readonly defaultOpen?: string | string[];
  readonly onChange?: (openIds: string[]) => void;
};

/** Internal representation of an accordion group. */
export type AccordionGroup = {
  mode: AccordionMode;
  open: Record<string, boolean>;
  activeItemId: string | null;
  items: AccordionItem[];
  defaultOpen: string[];
  onChange?: (openIds: string[]) => void;
};

/** Discriminator for change events. */
export type AccordionChangeSource = "user" | "initialization";

/** Detail payload for the `change` event. */
export interface AccordionChangeDetail {
  readonly groupId: string;
  readonly openIds: string[];
  readonly source: AccordionChangeSource;
}

/** Alpine-facing store surface. */
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

/** Options accepted by the accordion plugin factory. */
export interface CreateAccordionOptions {
  readonly id?: string;
}

/** Typed view of `Alpine` the accordion plugin uses internally. */
export type AccordionAlpine = Alpine<{ accordion: AccordionStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type AccordionPluginCallback = PluginCallback<AlpineBase>;
