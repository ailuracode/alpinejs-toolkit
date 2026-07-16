/**
 * Public entrypoint for `@ailuracode/alpine-virtual`.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core/types";
export { createVirtualController, VirtualController } from "./controller.js";
export { VirtualError, type VirtualErrorCode } from "./error.js";
export type {
  VirtualChangeDetail,
  VirtualEvents,
  VirtualRangeChangeDetail,
  VirtualScrollDetail,
} from "./events.js";
export { virtualOptions, virtualPlugin, virtualPlugin as default } from "./plugin.js";
export {
  createVirtualStore,
  createVirtualStoreFromController,
  syncInstanceRegistry,
} from "./store.js";
export type {
  CreateVirtualOptions,
  VirtualInstance,
  VirtualItem,
  VirtualKey,
  VirtualOptions,
  VirtualPluginCallback,
  VirtualScrollAlign,
  VirtualScrollBehavior,
  VirtualScrollDirection,
  VirtualScrollMode,
  VirtualScrollToIndexOptions,
  VirtualStore,
} from "./types.js";
export { DEFAULT_VIRTUAL_STORE_KEY } from "./types.js";
