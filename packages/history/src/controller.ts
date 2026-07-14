/**
 * Headless history controller — framework-agnostic core of
 * `@ailuracode/alpine-history`.
 */

import { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core";
import type { HistoryChangeDetail, HistoryEvents } from "./events.js";
import type {
  CloneStrategy,
  CreateHistoryControllerOptions,
  EqualityStrategy,
  HistoryEntry,
  HistoryEntryMeta,
  HistoryManager,
  NestedTransactionPolicy,
  PersistenceAdapter,
  TransactionHandle,
} from "./types.js";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 100;

function defaultClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultEquality<T>(a: T, b: T): boolean {
  return Object.is(a, b);
}

function estimateSize(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "string") {
    return (value as string).length * 2;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    return 8;
  }
  try {
    return JSON.stringify(value).length * 2;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Internal snapshot for transactions
// ---------------------------------------------------------------------------

interface TransactionSnapshot<T, TMeta> {
  undoStack: HistoryEntry<T, TMeta>[];
  value: T | undefined;
  meta: HistoryEntryMeta<TMeta> | undefined;
}

// ---------------------------------------------------------------------------
// HistoryController
// ---------------------------------------------------------------------------

/**
 * Headless undo/redo history controller.
 *
 * Owns private undo/redo stacks and exposes a readonly state surface.
 * New commits invalidate redo history. Transactions support commit,
 * rollback, and configurable nested policy.
 */
export class HistoryController<T, TMeta = unknown>
  extends BaseController<HistoryEvents<T, TMeta>>
  implements HistoryManager<T, TMeta>
{
  // ── Private configuration ────────────────────────────────────────────
  readonly #limit: number;
  readonly #maxSize: number | undefined;
  readonly #clone: CloneStrategy<T>;
  readonly #equality: EqualityStrategy<T>;
  readonly #persistence: PersistenceAdapter<T> | undefined;
  readonly #nestedTransactionPolicy: NestedTransactionPolicy;
  readonly #debounceMs: number | undefined;

  // ── Private state ────────────────────────────────────────────────────
  #undoStack: HistoryEntry<T, TMeta>[] = [];
  #redoStack: HistoryEntry<T, TMeta>[] = [];
  #currentValue: T | undefined;
  #currentMeta: HistoryEntryMeta<TMeta> | undefined;
  #initialValue: T | undefined;
  #hasInitialValue = false;
  #transactionDepth = 0;
  #transactionSnapshot: TransactionSnapshot<T, TMeta> | undefined;
  #debounceTimer: ReturnType<typeof setTimeout> | undefined;
  #pendingCommit: HistoryEntry<T, TMeta> | undefined;

  constructor(options: CreateHistoryControllerOptions<T> = {}) {
    super(options.id ?? generateId("history"));

    this.#limit = options.limit ?? DEFAULT_LIMIT;
    this.#maxSize = options.maxSize;
    this.#clone = options.clone ?? (defaultClone as CloneStrategy<T>);
    this.#equality = options.equality ?? (defaultEquality as EqualityStrategy<T>);
    this.#persistence = options.persistence;
    this.#nestedTransactionPolicy = options.nestedTransactionPolicy ?? "stack";
    this.#debounceMs = options.debounceMs;

    if (options.initialValue !== undefined) {
      this.#initialValue = this.#clone(options.initialValue);
      this.#currentValue = this.#clone(options.initialValue);
      this.#hasInitialValue = true;
      this.#currentMeta = {
        id: generateId("entry"),
        timestamp: Date.now(),
        label: "initial",
      };
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();

    if (this.#persistence) {
      try {
        const persisted = this.#persistence.load();
        if (persisted.length > 0) {
          this.#undoStack = [...(persisted as HistoryEntry<T, TMeta>[])];
          const last = persisted[persisted.length - 1];
          if (last) {
            this.#currentValue = last.value;
            this.#currentMeta = last.meta as HistoryEntryMeta<TMeta>;
          }
        }
      } catch {
        // Silently ignore persistence load errors
      }
    }

    queueMicrotask(() => {
      if (!this.isDestroyed) {
        this.#emitChange("initialization");
      }
    });
  }

  // ── Getters ──────────────────────────────────────────────────────────

  get value(): T | undefined {
    return this.#currentValue;
  }

  get canUndo(): boolean {
    return this.#undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.#redoStack.length > 0;
  }

  get undoStack(): readonly HistoryEntry<T, TMeta>[] {
    return [...this.#undoStack];
  }

  get redoStack(): readonly HistoryEntry<T, TMeta>[] {
    return [...this.#redoStack];
  }

  get transactionDepth(): number {
    return this.#transactionDepth;
  }

  get limit(): number {
    return this.#limit;
  }

  get maxSize(): number | undefined {
    return this.#maxSize;
  }

  // ── Commands ─────────────────────────────────────────────────────────

  commit(value: T, meta: { label?: string; group?: string; meta?: TMeta } = {}): void {
    if (this.isDestroyed) {
      return;
    }

    // Transaction active — just capture current value, defer stack push
    if (this.#transactionDepth > 0) {
      this.#currentValue = this.#clone(value);
      return;
    }

    // Deduplicate consecutive identical values
    if (this.#currentValue !== undefined && this.#equality(this.#currentValue, value)) {
      return;
    }

    const cloned = this.#clone(value);
    const entry: HistoryEntry<T, TMeta> = {
      value: cloned,
      meta: {
        id: generateId("entry"),
        timestamp: Date.now(),
        label: meta.label,
        group: meta.group,
        estimatedSize: estimateSize(cloned),
        meta: meta.meta,
      },
    };

    if (this.#debounceMs && this.#debounceMs > 0) {
      this.#pendingCommit = entry;
      if (this.#debounceTimer !== undefined) {
        clearTimeout(this.#debounceTimer);
      }
      this.#debounceTimer = setTimeout(() => {
        this.#debounceTimer = undefined;
        if (this.#pendingCommit) {
          const pending = this.#pendingCommit;
          this.#pendingCommit = undefined;
          this.#doCommit(pending.value, pending.meta);
        }
      }, this.#debounceMs);
    } else {
      this.#doCommit(entry.value, entry.meta);
    }
  }

  #doCommit(value: T, meta: HistoryEntryMeta<TMeta>): void {
    this.#redoStack = [];
    this.#undoStack.push({ value, meta });
    this.#currentValue = value;
    this.#currentMeta = meta;
    this.#enforceLimits();
    this.#emitChange("commit");
    this.#persist();
  }

  undo(): T | undefined {
    if (this.isDestroyed) {
      return undefined;
    }
    if (this.#undoStack.length === 0) {
      return undefined;
    }

    const entry = this.#undoStack.pop() as HistoryEntry<T, TMeta>;
    this.#redoStack.push({ value: this.#clone(entry.value), meta: entry.meta });

    if (this.#undoStack.length > 0) {
      const last = this.#undoStack[this.#undoStack.length - 1];
      if (last) {
        this.#currentValue = last.value;
        this.#currentMeta = last.meta;
      }
    } else if (this.#hasInitialValue) {
      this.#currentValue = this.#initialValue;
      this.#currentMeta = {
        id: generateId("entry"),
        timestamp: Date.now(),
        label: "initial",
      };
    } else {
      this.#currentValue = entry.value;
      this.#currentMeta = entry.meta;
    }

    this.#emitChange("undo");
    this.#persist();
    return this.#currentValue;
  }

  redo(): T | undefined {
    if (this.isDestroyed) {
      return undefined;
    }
    if (this.#redoStack.length === 0) {
      return undefined;
    }

    const entry = this.#redoStack.pop() as HistoryEntry<T, TMeta>;
    this.#undoStack.push({ value: this.#clone(entry.value), meta: entry.meta });
    this.#currentValue = entry.value;
    this.#currentMeta = entry.meta;

    this.#emitChange("redo");
    this.#persist();
    return this.#currentValue;
  }

  clear(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#undoStack = [];
    this.#redoStack = [];
    this.#emitChange("clear");
    this.#persist();
  }

  reset(value: T, meta: { label?: string; group?: string; meta?: TMeta } = {}): void {
    if (this.isDestroyed) {
      return;
    }
    this.#undoStack = [];
    this.#redoStack = [];
    this.#currentValue = this.#clone(value);
    this.#currentMeta = {
      id: generateId("entry"),
      timestamp: Date.now(),
      label: meta.label ?? "reset",
      group: meta.group,
      estimatedSize: estimateSize(this.#currentValue),
      meta: meta.meta,
    };
    this.#emitChange("reset");
    this.#persist();
  }

  checkpoint(meta: { label?: string; group?: string; meta?: TMeta } = {}): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.#currentValue === undefined) {
      return;
    }

    const cloned = this.#clone(this.#currentValue);

    const entry: HistoryEntry<T, TMeta> = {
      value: cloned,
      meta: {
        id: generateId("entry"),
        timestamp: Date.now(),
        label: meta.label ?? "checkpoint",
        group: meta.group,
        estimatedSize: estimateSize(cloned),
        meta: meta.meta,
      },
    };

    this.#undoStack.push(entry);
    this.#redoStack = [];
    this.#enforceLimits();
    this.#emitChange("checkpoint");
    this.#persist();
  }

  transaction(initialValue: T): TransactionHandle<T> {
    if (this.isDestroyed) {
      throw new ToolkitError("HistoryController was destroyed", "CONTROLLER_DESTROYED");
    }

    // Snapshot current state at transaction start (depth 0 only)
    if (this.#transactionDepth === 0) {
      this.#transactionSnapshot = {
        undoStack: [...this.#undoStack],
        value: this.#currentValue,
        meta: this.#currentMeta,
      };
    }

    this.#transactionDepth++;
    this.#currentValue = this.#clone(initialValue);
    this.#emitChange("transaction:start");

    const controller = this;
    let committed = false;

    const handle: TransactionHandle<T> = {
      get value(): T {
        return controller.#currentValue as T;
      },
      commit(): void {
        if (committed) {
          return;
        }
        committed = true;
        controller.#transactionDepth--;

        if (controller.#transactionDepth === 0) {
          const entry: HistoryEntry<T, TMeta> = {
            value: controller.#clone(controller.#currentValue as T),
            meta: {
              id: generateId("entry"),
              timestamp: Date.now(),
              label: "transaction",
            },
          };

          // Restore undo stack from snapshot and push transaction entry
          if (controller.#transactionSnapshot) {
            controller.#undoStack = controller.#transactionSnapshot.undoStack;
          }
          controller.#redoStack = [];
          controller.#undoStack.push(entry);
          controller.#currentMeta = entry.meta;
          controller.#enforceLimits();
          controller.#transactionSnapshot = undefined;
          controller.#emitChange("transaction:commit");
          controller.#persist();
        }
      },
      rollback(): void {
        if (committed) {
          return;
        }
        committed = true;
        controller.#transactionDepth--;

        if (controller.#transactionDepth === 0 && controller.#transactionSnapshot) {
          controller.#undoStack = controller.#transactionSnapshot.undoStack;
          controller.#currentValue = controller.#transactionSnapshot.value;
          controller.#currentMeta = controller.#transactionSnapshot.meta;
          controller.#transactionSnapshot = undefined;
          controller.#emitChange("transaction:rollback");
          controller.#persist();
        }
      },
    };

    return handle;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  #enforceLimits(): void {
    // Count-based eviction
    while (this.#undoStack.length > this.#limit) {
      this.#undoStack.shift();
    }

    // Size-based eviction
    if (this.#maxSize !== undefined && this.#maxSize > 0) {
      let totalSize = 0;
      let spliceIndex = 0;
      for (let i = 0; i < this.#undoStack.length; i++) {
        const entry = this.#undoStack[i];
        if (!entry) {
          break;
        }
        const size = entry.meta.estimatedSize ?? estimateSize(entry.value);
        if (totalSize + size > this.#maxSize) {
          break;
        }
        totalSize += size;
        spliceIndex = i + 1;
      }
      if (spliceIndex < this.#undoStack.length) {
        this.#undoStack.splice(0, spliceIndex);
      }
    }
  }

  #emitChange(source: HistoryChangeDetail<T, TMeta>["source"]): void {
    if (this.isDestroyed) {
      return;
    }

    const detail: HistoryChangeDetail<T, TMeta> = {
      source,
      value: this.#currentValue,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoStack: [...this.#undoStack],
      redoStack: [...this.#redoStack],
      transactionDepth: this.#transactionDepth,
    };

    this.emit("change", detail as HistoryEvents<T, TMeta>["change"]);
  }

  #persist(): void {
    if (!this.#persistence) {
      return;
    }
    try {
      this.#persistence.save([...this.#undoStack]);
    } catch {
      // Silently ignore persistence save errors
    }
  }
}

/** Creates a standalone {@link HistoryController}. */
export function createHistoryController<T, TMeta = unknown>(
  options?: CreateHistoryControllerOptions<T>
): HistoryController<T, TMeta> {
  return new HistoryController(options);
}
