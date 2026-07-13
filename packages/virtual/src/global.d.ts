/// <reference types="@types/alpinejs" />

import type { VirtualStore } from "./types";

export { createVirtualController, VirtualController } from "./controller";
export type { VirtualEvents, VirtualRangeChangeDetail, VirtualScrollDetail } from "./events";
export { createVirtualStore } from "./store";
export type {
  CreateVirtualOptions,
  VirtualInstance,
  VirtualItem,
  VirtualKey,
  VirtualOptions,
  VirtualScrollAlign,
  VirtualScrollToIndexOptions,
  VirtualStore,
} from "./types";

export default function virtualPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      virtual: VirtualStore;
    }
    interface Magics<T> {
      $virtual: VirtualStore;
    }
  }
}
