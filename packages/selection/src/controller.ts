/**
 * Selection controller — framework-agnostic core of
 * `@ailuracode/alpine-selection`.
 */

import { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core";
import { SelectionError } from "./error.js";
import type { SelectionChangeDetail, SelectionEvents } from "./events.js";
import {
  expandSelectedKeys,
  filterExistingKeys,
  pruneMultipleValue,
  pruneRangeValue,
  pruneSingleValue,
} from "./internal/keys.js";
import {
  clearSelection,
  extendSelection,
  replaceSelection,
  selectAllSelection,
  toggleSelection,
} from "./internal/transitions.js";
import {
  assertKnownKey,
  convertValueForModeChange,
  isControlledOptions,
  isRangeValue,
  type NormalizedSelectionOptions,
  normalizeSelectionOptions,
  normalizeValueForMode,
  toKeyString,
} from "./options.js";
import type {
  SelectionInstance,
  SelectionKey,
  SelectionMode,
  SelectionOptions,
  SelectionSelectOptions,
  SelectionValue,
} from "./types.js";

type InternalSelectionInstance = {
  options: NormalizedSelectionOptions;
  keys: string[];
  disabledKeys: Set<string>;
  value: SelectionValue;
  anchorKey: string | null;
  activeKey: string | null;
};

function snapshotInstance(instance: InternalSelectionInstance): SelectionInstance {
  const selectedKeys = expandSelectedKeys(
    instance.options.mode,
    instance.value,
    instance.keys,
    instance.disabledKeys,
    instance.options.allowDisabledSelection
  );

  return {
    mode: instance.options.mode,
    value: instance.value,
    keys: [...instance.keys],
    disabledKeys: [...instance.disabledKeys],
    anchorKey: instance.anchorKey,
    activeKey: instance.activeKey,
    selectedKeys,
    allowDisabledSelection: instance.options.allowDisabledSelection,
  };
}

function initialValue(options: NormalizedSelectionOptions): SelectionValue {
  const source = options.value ?? options.defaultValue;
  return normalizeValueForMode(source, options.mode);
}

function reconstructValueFromKeys(
  mode: SelectionMode,
  keys: readonly string[],
  selected: readonly string[]
): SelectionValue {
  const ordered = keys.length === 0 ? [...selected] : keys.filter((key) => selected.includes(key));

  if (mode === "single") {
    return ordered[0] ?? null;
  }
  if (mode === "multiple") {
    return ordered;
  }
  if (ordered.length === 0) {
    return null;
  }
  if (ordered.length === 1) {
    return { from: ordered[0] };
  }
  return { from: ordered[0], to: ordered[ordered.length - 1] };
}

function preservePointer(keys: readonly string[], pointer: string | null): string | null {
  if (pointer === null) {
    return null;
  }
  if (keys.length === 0) {
    return pointer;
  }
  return keys.includes(pointer) ? pointer : null;
}

function pruneValue(instance: InternalSelectionInstance): SelectionValue {
  const { mode, allowDisabledSelection } = instance.options;
  const { keys, disabledKeys, value } = instance;

  if (mode === "single") {
    const single = value === null || typeof value === "object" ? null : String(value);
    return pruneSingleValue(keys, single, disabledKeys, allowDisabledSelection);
  }

  if (mode === "multiple") {
    const multiple = Array.isArray(value) ? value.map((entry) => String(entry)) : [];
    return pruneMultipleValue(keys, multiple, disabledKeys, allowDisabledSelection);
  }

  const range = isRangeValue(value) ? value : null;
  const normalizedRange =
    range === null
      ? null
      : {
          from: String(range.from),
          to: range.to === undefined ? undefined : String(range.to),
        };
  return pruneRangeValue(keys, normalizedRange, disabledKeys, allowDisabledSelection);
}

/**
 * Headless selection controller with single, multiple, and range modes.
 */
export class SelectionController extends BaseController<SelectionEvents> {
  #instances: Record<string, InternalSelectionInstance> = {};

  constructor(id?: string) {
    super(id ?? generateId("selection"));
  }

  /** Whether a selection instance is registered. */
  hasInstance(id: string): boolean {
    return id in this.#instances;
  }

  /** Returns shallow snapshots of every instance. */
  snapshotInstances(): Record<string, SelectionInstance> {
    const result: Record<string, SelectionInstance> = {};
    for (const [instanceId, instance] of Object.entries(this.#instances)) {
      result[instanceId] = snapshotInstance(instance);
    }
    return result;
  }

  create(id: string, options: SelectionOptions = {}): void {
    this.#assertAlive();
    const normalized = normalizeSelectionOptions(options);
    const instance: InternalSelectionInstance = {
      options: normalized,
      keys: [...normalized.keys],
      disabledKeys: new Set(normalized.disabledKeys),
      value: initialValue(normalized),
      anchorKey: null,
      activeKey: null,
    };
    instance.value = pruneValue(instance);
    this.#instances[id] = instance;
  }

  /** Destroy a single selection instance by id. */
  destroy(id: string): void;
  /** Destroy all instances and the controller itself. */
  override destroy(): void;
  destroy(id?: string): void {
    if (id !== undefined) {
      this.#assertAlive();
      if (!(id in this.#instances)) {
        return;
      }
      delete this.#instances[id];
      return;
    }

    this.destroyAll();
    super.destroy();
  }

  destroyAll(): void {
    for (const instanceId of Object.keys(this.#instances)) {
      this.destroy(instanceId);
    }
  }

  setKeys(id: string, keys: readonly SelectionKey[]): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const previousSelected = expandSelectedKeys(
      instance.options.mode,
      instance.value,
      instance.keys,
      instance.disabledKeys,
      instance.options.allowDisabledSelection
    );
    instance.keys = keys.map((key) => toKeyString(key));
    const preserved = filterExistingKeys(instance.keys, previousSelected);
    const next = reconstructValueFromKeys(instance.options.mode, instance.keys, preserved);
    const pruned = pruneValue({ ...instance, value: next });
    this.#commit(id, instance, pruned, {
      anchor: preservePointer(instance.keys, instance.anchorKey),
      active: preservePointer(instance.keys, instance.activeKey),
    });
  }

  setDisabledKeys(id: string, keys: readonly SelectionKey[]): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    instance.disabledKeys = new Set(keys.map((key) => toKeyString(key)));
    this.#commit(id, instance, pruneValue(instance), {
      anchor: instance.anchorKey,
      active: instance.activeKey,
    });
  }

  setMode(id: string, mode: SelectionMode): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    if (instance.options.mode === mode) {
      return;
    }

    const previousMode = instance.options.mode;
    const converted = convertValueForModeChange(instance.value, previousMode, mode, instance.keys);
    instance.options = { ...instance.options, mode };
    const pruned = pruneValue({ ...instance, value: converted });
    this.#commit(id, instance, pruned, {
      anchor: instance.anchorKey,
      active: instance.activeKey,
    });
  }

  setValue(id: string, value: SelectionValue): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const normalized = normalizeValueForMode(value, instance.options.mode);
    const pruned = pruneValue({ ...instance, value: normalized });
    this.#commit(id, instance, pruned, {
      anchor: instance.anchorKey,
      active: instance.activeKey,
    });
  }

  select(id: string, key: SelectionKey, options: SelectionSelectOptions = {}): void {
    const behavior = options.behavior ?? "replace";
    if (behavior === "toggle") {
      this.toggle(id, key);
      return;
    }
    if (behavior === "extend") {
      this.extend(id, key);
      return;
    }
    this.replace(id, key);
  }

  replace(id: string, key: SelectionKey): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const keyString = toKeyString(key);
    assertKnownKey(instance.keys, keyString);
    if (!this.#canSelect(instance, keyString)) {
      return;
    }

    const next = replaceSelection(instance.options.mode, keyString);
    this.#commit(id, instance, next, { anchor: keyString, active: keyString });
  }

  toggle(id: string, key: SelectionKey): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const keyString = toKeyString(key);
    assertKnownKey(instance.keys, keyString);
    if (!(this.#canSelect(instance, keyString) || this.isSelected(id, key))) {
      return;
    }

    const next = toggleSelection(instance.options.mode, instance.value, keyString);
    const pruned = pruneValue({ ...instance, value: next });
    this.#commit(id, instance, pruned, { anchor: keyString, active: keyString });
  }

  extend(id: string, key: SelectionKey): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const keyString = toKeyString(key);
    assertKnownKey(instance.keys, keyString);
    if (!this.#canSelect(instance, keyString)) {
      return;
    }

    const anchor = instance.anchorKey ?? keyString;
    const next = extendSelection(
      instance.options.mode,
      instance.value,
      anchor,
      keyString,
      instance.keys,
      instance.disabledKeys,
      instance.options.allowDisabledSelection
    );
    const pruned = pruneValue({ ...instance, value: next });
    this.#commit(id, instance, pruned, { anchor, active: keyString });
  }

  clear(id: string): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const next = clearSelection(instance.options.mode);
    this.#commit(id, instance, next, { anchor: null, active: instance.activeKey });
  }

  selectAll(id: string): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const next = selectAllSelection(
      instance.options.mode,
      instance.keys,
      instance.disabledKeys,
      instance.options.allowDisabledSelection
    );
    const pruned = pruneValue({ ...instance, value: next });
    const selected = expandSelectedKeys(
      instance.options.mode,
      pruned,
      instance.keys,
      instance.disabledKeys,
      instance.options.allowDisabledSelection
    );
    const anchor = selected[0] ?? null;
    const active = selected[selected.length - 1] ?? null;
    this.#commit(id, instance, pruned, { anchor, active });
  }

  setActive(id: string, key: SelectionKey | null): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const next = key === null ? null : toKeyString(key);
    if (next !== null) {
      assertKnownKey(instance.keys, next);
    }
    if (instance.activeKey === next) {
      return;
    }
    instance.activeKey = next;
    this.#notifyChange(id, instance.value);
  }

  setAnchor(id: string, key: SelectionKey | null): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const next = key === null ? null : toKeyString(key);
    if (next !== null) {
      assertKnownKey(instance.keys, next);
    }
    if (instance.anchorKey === next) {
      return;
    }
    instance.anchorKey = next;
    this.#notifyChange(id, instance.value);
  }

  isSelected(id: string, key: SelectionKey): boolean {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const keyString = toKeyString(key);
    const selected = expandSelectedKeys(
      instance.options.mode,
      instance.value,
      instance.keys,
      instance.disabledKeys,
      instance.options.allowDisabledSelection
    );
    return selected.includes(keyString);
  }

  isSelectable(id: string, key: SelectionKey): boolean {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const keyString = toKeyString(key);
    if (instance.keys.length > 0 && !instance.keys.includes(keyString)) {
      return false;
    }
    return this.#canSelect(instance, keyString);
  }

  isActive(id: string, key: SelectionKey): boolean {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    return instance.activeKey === toKeyString(key);
  }

  isAnchor(id: string, key: SelectionKey): boolean {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    return instance.anchorKey === toKeyString(key);
  }

  getSnapshot(id: string): SelectionInstance {
    this.#assertAlive();
    return snapshotInstance(this.#requireInstance(id));
  }

  listProps(
    id: string,
    options: { label?: string } = {}
  ): Record<string, string | boolean | undefined> {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const multiselectable = instance.options.mode !== "single";
    return {
      role: "listbox",
      "aria-label": options.label,
      "aria-multiselectable": multiselectable ? true : undefined,
    };
  }

  itemProps(id: string, key: SelectionKey): Record<string, string | number | boolean | undefined> {
    this.#assertAlive();
    const keyString = toKeyString(key);
    const selected = this.isSelected(id, key);
    const active = this.isActive(id, key);
    const selectable = this.isSelectable(id, key);

    return {
      role: "option",
      "data-selection-key": keyString,
      "aria-selected": selected,
      "aria-disabled": selectable ? undefined : true,
      "data-selection-active": active ? true : undefined,
    };
  }

  #canSelect(instance: InternalSelectionInstance, key: string): boolean {
    if (instance.options.allowDisabledSelection) {
      return true;
    }
    return !instance.disabledKeys.has(key);
  }

  #commit(
    id: string,
    instance: InternalSelectionInstance,
    next: SelectionValue,
    pointers: { anchor: string | null; active: string | null }
  ): void {
    const previous = instance.value;
    if (
      this.#valuesEqual(previous, next, instance.options.mode) &&
      instance.anchorKey === pointers.anchor &&
      instance.activeKey === pointers.active
    ) {
      return;
    }

    instance.value = next;
    instance.anchorKey = pointers.anchor;
    instance.activeKey = pointers.active;

    if (isControlledOptions(instance.options)) {
      instance.options.onChange?.(this.#buildDetail(id, instance, previous));
      return;
    }

    this.#notifyChange(id, previous);
  }

  #notifyChange(id: string, previous: SelectionValue): void {
    const instance = this.#instances[id];
    if (!instance) {
      return;
    }
    this.emit("change", this.#buildDetail(id, instance, previous));
  }

  #buildDetail(
    id: string,
    instance: InternalSelectionInstance,
    previous: SelectionValue
  ): SelectionChangeDetail {
    const snapshot = snapshotInstance(instance);
    return {
      id,
      mode: instance.options.mode,
      value: instance.value,
      previous,
      anchorKey: instance.anchorKey,
      activeKey: instance.activeKey,
      selectedKeys: snapshot.selectedKeys,
      snapshot,
    };
  }

  #valuesEqual(previous: SelectionValue, next: SelectionValue, mode: SelectionMode): boolean {
    if (mode === "single") {
      return previous === next;
    }
    if (mode === "multiple") {
      const prev = Array.isArray(previous) ? previous : [];
      const nxt = Array.isArray(next) ? next : [];
      if (prev.length !== nxt.length) {
        return false;
      }
      return prev.every((entry, index) => entry === nxt[index]);
    }

    const prevRange = isRangeValue(previous) ? previous : null;
    const nextRange = isRangeValue(next) ? next : null;
    if (prevRange === null && nextRange === null) {
      return true;
    }
    if (prevRange === null || nextRange === null) {
      return false;
    }
    return prevRange.from === nextRange.from && prevRange.to === nextRange.to;
  }

  #requireInstance(id: string): InternalSelectionInstance {
    const instance = this.#instances[id];
    if (!instance) {
      throw new SelectionError(`selection instance "${id}" was not found`, "INSTANCE_NOT_FOUND");
    }
    return instance;
  }

  #assertAlive(): void {
    if (this.isDestroyed) {
      throw new ToolkitError("SelectionController was destroyed", "CONTROLLER_DESTROYED");
    }
  }
}

/** Creates a standalone {@link SelectionController}. */
export function createSelectionController(id?: string): SelectionController {
  return new SelectionController(id);
}
