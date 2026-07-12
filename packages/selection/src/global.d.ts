/// <reference types="@types/alpinejs" />

import type { SelectionStore } from "./types";

export { createSelectionController, SelectionController } from "./controller";
export type { SelectionChangeDetail, SelectionEvents } from "./events";
export { createSelectionStore } from "./store";
export type {
  CreateSelectionOptions,
  SelectionInstance,
  SelectionKey,
  SelectionMode,
  SelectionOptions,
  SelectionRange,
  SelectionStore,
  SelectionValue,
} from "./types";

export default function selectionPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      selection: SelectionStore;
    }
    interface Magics<T> {
      $selection: SelectionStore;
    }
  }
}
