/**
 * Store factory for `@ailuracode/alpine-history`.
 */

import { HistoryController } from "./controller.js";
import type { CreateHistoryControllerOptions, HistoryStore } from "./types.js";

/**
 * Wraps a {@link HistoryController} into a plain store object
 * suitable for `Alpine.store()`.
 *
 * All derived properties are plain values (not getters) so that Alpine's
 * reactive proxy can track and propagate changes via its `set` trap.
 * The caller (plugin or standalone) is responsible for keeping them in sync
 * via the controller's `change` event.
 */
export function wrapHistoryStore<T, TMeta = unknown>(
  controller: HistoryController<T, TMeta>
): HistoryStore<T, TMeta> {
  const store: HistoryStore<T, TMeta> = {
    value: controller.value,
    canUndo: controller.canUndo,
    canRedo: controller.canRedo,
    undoStack: controller.undoStack,
    redoStack: controller.redoStack,
    transactionDepth: controller.transactionDepth,
    commit: (value, meta) => controller.commit(value, meta),
    undo: () => controller.undo(),
    redo: () => controller.redo(),
    clear: () => controller.clear(),
    reset: (value, meta) => controller.reset(value, meta),
    checkpoint: (meta) => controller.checkpoint(meta),
    transaction: (initialValue) => controller.transaction(initialValue),
    destroy: () => {
      controller.destroy();
    },
  };

  return store;
}

/** Builds a {@link HistoryStore} backed by a new {@link HistoryController}. */
export function createHistoryStore<T, TMeta = unknown>(
  options?: CreateHistoryControllerOptions<T>
): HistoryStore<T, TMeta> {
  const controller = new HistoryController<T, TMeta>(options);
  controller.mount();
  const store = wrapHistoryStore(controller);
  controller.on("change", (detail) => {
    store.value = detail.value;
    store.canUndo = controller.canUndo;
    store.canRedo = controller.canRedo;
    store.undoStack = controller.undoStack;
    store.redoStack = controller.redoStack;
    store.transactionDepth = controller.transactionDepth;
  });
  return store;
}
