/**
 * Public entrypoint for `@ailuracode/alpine-sidebar` v2.1.0.
 *
 * Per `.agents/instructions/public-api.instructions.md`, this file
 * MUST only contain re-exports. The framework-agnostic controller
 * lives in `./controller.ts`; the supporting pure helpers and
 * types live in `./types.ts`, `./events.ts`, and `./internal/*`.
 *
 * The v2.1.0 entrypoint exposes:
 *
 * - `createSidebar({ ... })` — standalone factory returning a
 *   fully-mounted {@link SidebarController}.
 * - The `SidebarController` class itself for advanced consumers
 *   that want to bypass the singleton.
 * - `sidebarPlugin(opts)` — Alpine adapter that wires the singleton
 *   into `$store.sidebar` and `$sidebar`.
 * - `createSidebarStore(controller)` — pure helper used by the
 *   adapter (also exposed for advanced consumers).
 * - Persistence adapters (v2.1.0): `createLocalStorageSidebarStorage`,
 *   `createMemorySidebarStorage`, `persistSidebarVisible`,
 *   `withSidebarVisiblePersist`.
 * - All v2.0 type contracts (events, change detail, breakpoint
 *   option, store, manager, plugin callback) + v2.1.0 persistence
 *   types (SidebarStorage, LocalStorageSidebarStorageOptions,
 *   PersistSidebarVisibleOptions, SidebarAlpineLike).
 */

// --- Controller primitives (used directly + by the plugin) -----------
export { createSidebar, SidebarController } from "./controller";
// --- Event surface ---------------------------------------------------
export type { SidebarEvents, SidebarListener } from "./events";
// --- Storage adapters (v2.1.0) --------------------------------------
export { createLocalStorageSidebarStorage } from "./internal/storage/local-storage";
export { createMemorySidebarStorage } from "./internal/storage/memory";
export {
  persistSidebarVisible,
  type SidebarVisibleProxy,
  withSidebarVisiblePersist,
} from "./internal/storage/persist";
// --- Alpine plugin adapter -----------------------------------------
export { createSidebarStore, sidebarPlugin } from "./plugin";
// --- Public types (state contracts, options, plugin callback) --------
export type {
  CreateSidebarOptions,
  PersistSidebarVisibleOptions,
  SidebarAlpine,
  SidebarAlpineLike,
  SidebarBreakpointOption,
  SidebarChangeDetail,
  SidebarChangeSource,
  LocalStorageSidebarStorageOptions,
  SidebarManager,
  SidebarOnMismatch,
  SidebarPluginCallback,
  SidebarStorage,
  SidebarStore,
} from "./types";
// --- Public constants ------------------------------------------------
export { DEFAULT_SIDEBAR_STORAGE_KEY } from "./types";
