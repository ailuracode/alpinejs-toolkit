/// <reference types="@types/alpinejs" />

import type { VirtualStore } from "./types";

export { VirtualController, createVirtualController } from "./controller";
export { createVirtualStore } from "./store";
export type { VirtualEvents, VirtualRangeChangeDetail, VirtualScrollDetail } from "./events";
export type {
  VirtualInstance,
  VirtualItem,
  VirtualKey,
  VirtualOptions,
  VirtualScrollAlign,
  VirtualScrollToIndexOptions,
  VirtualStore,
  CreateVirtualOptions,
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
