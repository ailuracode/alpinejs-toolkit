/**
 * Public entrypoint for `@ailuracode/alpine-selection`.
 */

export { createControlledAdapter, createUncontrolledAdapter } from "./adapter.js";
export { createSelectionController, SelectionController } from "./controller.js";
export type { Unsubscribe } from "./core-deps.js";
export { SelectionError, type SelectionErrorCode } from "./error.js";
export type { SelectionChangeDetail, SelectionEvents } from "./events.js";
export { selectionOptions, selectionPlugin, selectionPlugin as default } from "./plugin.js";
export {
  createSelectionStore,
  createSelectionStoreFromController,
  syncInstanceRegistry,
} from "./store.js";
export type {
  ControlledSelectionOptions,
  CreateSelectionOptions,
  SelectionAdapter,
  SelectionBehavior,
  SelectionInstance,
  SelectionKey,
  SelectionMode,
  SelectionOptions,
  SelectionPluginCallback,
  SelectionRange,
  SelectionSelectOptions,
  SelectionStore,
  SelectionValue,
  UncontrolledSelectionOptions,
} from "./types.js";
export { DEFAULT_SELECTION_STORE_KEY } from "./types.js";
