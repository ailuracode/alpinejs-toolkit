/**
 * Virtual list controller — framework-agnostic core of
 * `@ailuracode/alpine-virtual`.
 *
 * Calculates visible ranges, item offsets, and scroll commands without
 * rendering markup. Browser measurement is isolated behind bind APIs.
 */

import { isBrowser } from "@ailuracode/alpine-core/browser";
import { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core/controller";
import { VirtualError } from "./error.js";
import type { VirtualEvents } from "./events.js";
import {
  adjustScrollOffsetForResize,
  buildMeasurements,
  calculateVisibleRange,
  clampScrollOffset,
  getOffsetForIndex,
  type ItemMeasurement,
  indexAtOffset,
  sliceVirtualItems,
} from "./internal/measurements.js";
import {
  attachResizeObserver,
  attachScrollListener,
  readScrollOffset,
  type ScrollRect,
  type ScrollTarget,
  writeScrollOffset,
} from "./internal/observers.js";
import { type NormalizedVirtualOptions, normalizeVirtualOptions } from "./options.js";
import type {
  VirtualInstance,
  VirtualItem,
  VirtualKey,
  VirtualOptions,
  VirtualScrollDirection,
  VirtualScrollToIndexOptions,
} from "./types.js";

type InternalVirtualInstance = {
  options: NormalizedVirtualOptions;
  keys: VirtualKey[];
  sizeByKey: Map<VirtualKey, number>;
  measurements: ItemMeasurement[];
  totalSize: number;
  scrollOffset: number;
  scrollDirection: VirtualScrollDirection;
  isScrolling: boolean;
  viewportSize: number;
  startIndex: number;
  endIndex: number;
  virtualItems: VirtualItem[];
  scrollElement: ScrollTarget | null;
  scrollCleanup: (() => void) | null;
  resizeCleanup: (() => void) | null;
  scrollEndTimer: ReturnType<typeof setTimeout> | null;
};

function createKeys(options: NormalizedVirtualOptions): VirtualKey[] {
  const keys: VirtualKey[] = [];
  for (let index = 0; index < options.count; index++) {
    keys.push(options.getItemKey(index));
  }
  return keys;
}

function snapshotVirtualInstance(instance: InternalVirtualInstance): VirtualInstance {
  return {
    count: instance.options.count,
    scrollOffset: instance.scrollOffset,
    scrollDirection: instance.scrollDirection,
    isScrolling: instance.isScrolling,
    totalSize: instance.totalSize,
    viewportSize: instance.viewportSize,
    startIndex: instance.startIndex,
    endIndex: instance.endIndex,
    virtualItems: instance.virtualItems.map((item) => ({ ...item })),
    options: {
      count: instance.options.count,
      horizontal: instance.options.horizontal,
      estimateSize: instance.options.estimateSize,
      overscan: instance.options.overscan,
      paddingStart: instance.options.paddingStart,
      paddingEnd: instance.options.paddingEnd,
      scrollMargin: instance.options.scrollMargin,
      gap: instance.options.gap,
      scrollMode: instance.options.scrollMode,
    },
  };
}

function defaultInternalInstance(options: NormalizedVirtualOptions): InternalVirtualInstance {
  const keys = createKeys(options);
  const sizeByKey = new Map<VirtualKey, number>();
  const built = buildMeasurements(options, keys, sizeByKey);

  return {
    options,
    keys,
    sizeByKey,
    measurements: built.measurements,
    totalSize: built.totalSize,
    scrollOffset: 0,
    scrollDirection: "none",
    isScrolling: false,
    viewportSize: 0,
    startIndex: 0,
    endIndex: -1,
    virtualItems: [],
    scrollElement: null,
    scrollCleanup: null,
    resizeCleanup: null,
    scrollEndTimer: null,
  };
}

/**
 * Headless virtual list controller. Manages a registry of virtual list
 * instances with fixed or variable item sizes.
 */
export class VirtualController extends BaseController<VirtualEvents> {
  #instances: Record<string, InternalVirtualInstance> = {};

  constructor(id?: string) {
    super(id ?? generateId("virtual"));
  }

  /** Whether a virtual list instance is registered. */
  hasInstance(id: string): boolean {
    return id in this.#instances;
  }

  /** Returns a shallow snapshot of all instances for adapter sync. */
  snapshotInstances(): Record<string, VirtualInstance> {
    const result: Record<string, VirtualInstance> = {};
    for (const [instanceId, instance] of Object.entries(this.#instances)) {
      result[instanceId] = snapshotVirtualInstance(instance);
    }
    return result;
  }

  create(id: string, options: VirtualOptions = {}): void {
    this.#assertAlive();
    const normalized = normalizeVirtualOptions(options);
    this.#instances[id] = defaultInternalInstance(normalized);
    this.#recalculate(id);
    this.#notifyChange(id);
  }

  /** Destroy a single virtual list instance by id. */
  destroy(id: string): void;
  /** Destroy all instances and the controller itself. */
  override destroy(): void;
  destroy(id?: string): void {
    if (id !== undefined) {
      this.#assertAlive();
      const instance = this.#instances[id];
      if (!instance) {
        return;
      }
      this.#teardownObservers(instance);
      delete this.#instances[id];
      this.#notifyChange(id);
      return;
    }

    this.destroyAll();
    super.destroy();
  }

  destroyAll(): void {
    for (const id of Object.keys(this.#instances)) {
      this.destroy(id);
    }
  }

  bindScrollElement(id: string, element: HTMLElement | null): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    this.#teardownObservers(instance);

    if (!isBrowser() || element === null) {
      instance.scrollElement = null;
      this.#recalculate(id);
      this.#notifyChange(id);
      return;
    }

    instance.scrollElement = instance.options.scrollMode === "window" ? window : element;
    this.#attachObservers(id, instance);
    instance.scrollOffset = readScrollOffset(instance.scrollElement, instance.options.horizontal);
    this.#recalculate(id);
    this.#notifyChange(id);
  }

  setCount(id: string, count: number): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const previousMeasurements = instance.measurements;
    const anchorIndex = indexAtOffset(previousMeasurements, instance.scrollOffset);

    instance.options = {
      ...instance.options,
      count,
    };
    instance.keys = createKeys(instance.options);
    this.#rebuildMeasurements(id, instance, previousMeasurements, anchorIndex);
  }

  setKeys(id: string, keys: readonly VirtualKey[]): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    if (keys.length !== instance.options.count) {
      throw new VirtualError(
        `setKeys length (${keys.length}) must match count (${instance.options.count})`,
        "INVALID_INDEX"
      );
    }

    const previousMeasurements = instance.measurements;
    const anchorIndex = indexAtOffset(previousMeasurements, instance.scrollOffset);
    instance.keys = [...keys];
    this.#rebuildMeasurements(id, instance, previousMeasurements, anchorIndex);
  }

  measureItem(id: string, index: number, size: number): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    if (index < 0 || index >= instance.options.count) {
      throw new VirtualError(`index ${index} is out of range`, "INVALID_INDEX");
    }
    if (size <= 0) {
      throw new RangeError(`measureItem size must be > 0, received ${size}`);
    }

    const key = instance.keys[index] ?? instance.options.getItemKey(index);
    const previousSize = instance.sizeByKey.get(key);
    if (previousSize === size) {
      return;
    }

    const previousMeasurements = instance.measurements;
    const anchorIndex = indexAtOffset(previousMeasurements, instance.scrollOffset);
    instance.sizeByKey.set(key, size);
    this.#rebuildMeasurements(id, instance, previousMeasurements, anchorIndex);
  }

  scrollToIndex(id: string, index: number, options: VirtualScrollToIndexOptions = {}): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const clampedIndex = Math.max(0, Math.min(index, instance.options.count - 1));
    const align = options.align ?? "auto";
    const behavior = options.behavior ?? "auto";

    const offsetInfo = getOffsetForIndex(
      instance.measurements,
      clampedIndex,
      align,
      instance.viewportSize,
      instance.options.scrollMargin
    );

    if (!offsetInfo) {
      return;
    }

    const nextOffset = clampScrollOffset(
      offsetInfo.offset,
      instance.totalSize,
      instance.viewportSize
    );
    this.#applyScrollOffset(id, instance, nextOffset, behavior);
  }

  scrollToOffset(
    id: string,
    offset: number,
    options: Pick<VirtualScrollToIndexOptions, "behavior"> = {}
  ): void {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const behavior = options.behavior ?? "auto";
    const nextOffset = clampScrollOffset(offset, instance.totalSize, instance.viewportSize);
    this.#applyScrollOffset(id, instance, nextOffset, behavior);
  }

  getVirtualItems(id: string): readonly VirtualItem[] {
    this.#assertAlive();
    return this.#requireInstance(id).virtualItems;
  }

  getTotalSize(id: string): number {
    this.#assertAlive();
    return this.#requireInstance(id).totalSize;
  }

  listProps(
    id: string,
    options: { label?: string } = {}
  ): Record<string, string | boolean | undefined> {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    return {
      role: "list",
      "aria-label": options.label,
      "aria-orientation": instance.options.horizontal ? "horizontal" : "vertical",
    };
  }

  itemProps(id: string, index: number): Record<string, string | number | boolean | undefined> {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    const item = instance.virtualItems.find((entry) => entry.index === index);

    if (!item) {
      return {
        role: "listitem",
        "aria-setsize": instance.options.count,
        "aria-posinset": index + 1,
      };
    }

    return {
      role: "listitem",
      "aria-setsize": instance.options.count,
      "aria-posinset": index + 1,
      "data-virtual-index": index,
      "data-virtual-start": item.start,
      "data-virtual-size": item.size,
    };
  }

  contentProps(id: string): Record<string, string | number | undefined> {
    this.#assertAlive();
    const instance = this.#requireInstance(id);
    return {
      "data-virtual-total-size": instance.totalSize,
    };
  }

  #attachObservers(id: string, instance: InternalVirtualInstance): void {
    const target = instance.scrollElement;
    if (!target) {
      return;
    }

    let previousOffset = instance.scrollOffset;

    instance.scrollCleanup = attachScrollListener(target, () => {
      const nextOffset = readScrollOffset(target, instance.options.horizontal);
      const direction: VirtualScrollDirection =
        nextOffset > previousOffset ? "forward" : nextOffset < previousOffset ? "backward" : "none";
      previousOffset = nextOffset;
      instance.scrollOffset = nextOffset;
      instance.scrollDirection = direction;
      instance.isScrolling = true;
      this.#recalculate(id);
      this.#notifyScroll(id, instance);

      if (instance.scrollEndTimer) {
        clearTimeout(instance.scrollEndTimer);
      }
      instance.scrollEndTimer = setTimeout(() => {
        instance.isScrolling = false;
        this.#notifyScroll(id, instance);
      }, 150);
    });

    const resizeTarget = target === window ? window : (target as HTMLElement);
    instance.resizeCleanup = attachResizeObserver(resizeTarget, (rect: ScrollRect) => {
      instance.viewportSize = instance.options.horizontal ? rect.width : rect.height;
      this.#recalculate(id);
      this.#notifyChange(id);
    });
  }

  #teardownObservers(instance: InternalVirtualInstance): void {
    instance.scrollCleanup?.();
    instance.scrollCleanup = null;
    instance.resizeCleanup?.();
    instance.resizeCleanup = null;
    if (instance.scrollEndTimer) {
      clearTimeout(instance.scrollEndTimer);
      instance.scrollEndTimer = null;
    }
    instance.scrollElement = null;
  }

  #rebuildMeasurements(
    id: string,
    instance: InternalVirtualInstance,
    previousMeasurements: readonly ItemMeasurement[],
    anchorIndex: number
  ): void {
    const built = buildMeasurements(instance.options, instance.keys, instance.sizeByKey);
    instance.measurements = built.measurements;
    instance.totalSize = built.totalSize;
    instance.scrollOffset = adjustScrollOffsetForResize(
      previousMeasurements,
      built.measurements,
      instance.scrollOffset,
      anchorIndex
    );
    this.#recalculate(id);
    this.#notifyChange(id);
  }

  #recalculate(id: string): void {
    const instance = this.#instances[id];
    if (!instance) {
      return;
    }

    const range = calculateVisibleRange(
      instance.measurements,
      instance.scrollOffset,
      instance.viewportSize,
      instance.options.overscan
    );

    instance.startIndex = range.startIndex;
    instance.endIndex = range.endIndex;
    instance.virtualItems = sliceVirtualItems(instance.measurements, range);

    const previousRange = this.listenerCount("rangeChange") > 0;
    if (previousRange) {
      this.emit("rangeChange", {
        id,
        startIndex: instance.startIndex,
        endIndex: instance.endIndex,
        virtualItems: instance.virtualItems,
      });
    }
  }

  #applyScrollOffset(
    id: string,
    instance: InternalVirtualInstance,
    offset: number,
    behavior: ScrollBehavior
  ): void {
    instance.scrollOffset = offset;
    this.#recalculate(id);
    this.#notifyChange(id);

    if (instance.scrollElement) {
      writeScrollOffset(instance.scrollElement, offset, instance.options.horizontal, behavior);
    }
  }

  #notifyChange(id: string): void {
    const instance = this.#instances[id];
    instance?.options.onChange?.();
    this.emit("change", { id });
  }

  #notifyScroll(id: string, instance: InternalVirtualInstance): void {
    this.emit("scroll", {
      id,
      scrollOffset: instance.scrollOffset,
      scrollDirection: instance.scrollDirection,
      isScrolling: instance.isScrolling,
    });
  }

  #requireInstance(id: string): InternalVirtualInstance {
    const instance = this.#instances[id];
    if (!instance) {
      throw new VirtualError(`virtual instance "${id}" was not found`, "INSTANCE_NOT_FOUND");
    }
    return instance;
  }

  #assertAlive(): void {
    if (this.isDestroyed) {
      throw new ToolkitError("VirtualController was destroyed", "CONTROLLER_DESTROYED");
    }
  }
}

/** Creates a standalone {@link VirtualController}. */
export function createVirtualController(id?: string): VirtualController {
  return new VirtualController(id);
}
