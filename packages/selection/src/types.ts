/**
 * Public type contracts for `@ailuracode/alpine-selection`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import type { SelectionChangeDetail } from "./events.js";

/** Stable identity for a selectable item. */
export type SelectionKey = string | number;

/** Selection behavior mode. */
export type SelectionMode = "single" | "multiple" | "range";

/** Range selection endpoints. */
export type SelectionRange = {
  readonly from: SelectionKey;
  readonly to?: SelectionKey;
};

/** Mode-specific selection value. */
export type SelectionValue = SelectionKey | null | readonly SelectionKey[] | SelectionRange | null;

/** Semantic command behavior for pointer and keyboard interactions. */
export type SelectionBehavior = "replace" | "toggle" | "extend";

/** Options when issuing a select command. */
export type SelectionSelectOptions = {
  readonly behavior?: SelectionBehavior;
};

/** Options passed when creating a selection instance. */
export type SelectionOptions = {
  readonly mode?: SelectionMode;
  readonly keys?: readonly SelectionKey[];
  readonly disabledKeys?: readonly SelectionKey[];
  readonly allowDisabledSelection?: boolean;
  readonly value?: SelectionValue;
  readonly defaultValue?: SelectionValue;
  readonly onChange?: (detail: SelectionChangeDetail) => void;
};

/** Readonly snapshot of one selection instance. */
export type SelectionInstance = {
  readonly mode: SelectionMode;
  readonly value: SelectionValue;
  readonly keys: readonly SelectionKey[];
  readonly disabledKeys: readonly SelectionKey[];
  readonly anchorKey: SelectionKey | null;
  readonly activeKey: SelectionKey | null;
  readonly selectedKeys: readonly SelectionKey[];
  readonly allowDisabledSelection: boolean;
};

/** Controlled selection wiring. */
export type ControlledSelectionOptions = {
  readonly mode: SelectionMode;
  readonly value: SelectionValue;
  readonly onChange: (detail: SelectionChangeDetail) => void;
  readonly keys?: readonly SelectionKey[];
  readonly disabledKeys?: readonly SelectionKey[];
  readonly allowDisabledSelection?: boolean;
};

/** Uncontrolled selection wiring. */
export type UncontrolledSelectionOptions = Omit<SelectionOptions, "value">;

/** External state adapter surface. */
export type SelectionAdapter = {
  readonly isControlled: boolean;
  getValue(): SelectionValue;
  setValue(value: SelectionValue): void;
  subscribe(listener: () => void): () => void;
};

/** Alpine-facing store surface. */
export type SelectionStore = {
  readonly instances: Record<string, SelectionInstance>;
  create(id: string, options?: SelectionOptions): void;
  destroy(id: string): void;
  destroyAll(): void;
  setKeys(id: string, keys: readonly SelectionKey[]): void;
  setDisabledKeys(id: string, keys: readonly SelectionKey[]): void;
  setMode(id: string, mode: SelectionMode): void;
  setValue(id: string, value: SelectionValue): void;
  select(id: string, key: SelectionKey, options?: SelectionSelectOptions): void;
  replace(id: string, key: SelectionKey): void;
  toggle(id: string, key: SelectionKey): void;
  extend(id: string, key: SelectionKey): void;
  clear(id: string): void;
  selectAll(id: string): void;
  setActive(id: string, key: SelectionKey | null): void;
  setAnchor(id: string, key: SelectionKey | null): void;
  isSelected(id: string, key: SelectionKey): boolean;
  isSelectable(id: string, key: SelectionKey): boolean;
  isActive(id: string, key: SelectionKey): boolean;
  isAnchor(id: string, key: SelectionKey): boolean;
  getSnapshot(id: string): SelectionInstance;
  itemProps(id: string, key: SelectionKey): Record<string, string | number | boolean | undefined>;
  listProps(id: string, options?: { label?: string }): Record<string, string | boolean | undefined>;
};

/** Options accepted by the selection plugin factory. */
export interface CreateSelectionOptions {
  readonly id?: string;
}

/** Typed view of `Alpine` the selection plugin uses internally. */
export type SelectionAlpine = Alpine<{ selection: SelectionStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type SelectionPluginCallback = PluginCallback<AlpineBase>;
