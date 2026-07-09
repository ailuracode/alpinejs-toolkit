/**
 * Public entrypoint for `@ailuracode/alpine-sidebar` v2.0.
 *
 * Per `.agents/instructions/public-api.instructions.md`, this file
 * MUST only contain re-exports. The framework-agnostic controller
 * lives in `./controller.ts`; the supporting pure helpers and
 * types live in `./types.ts`, `./events.ts`, and `./internal/*`.
 *
 * The v2.0 entrypoint exposes:
 *
 * - `createSidebar({ ... })` — standalone factory returning a
 *   fully-mounted {@link SidebarController}.
 * - The `SidebarController` class itself for advanced consumers
 *   that want to bypass the singleton.
 * - All v2.0 type contracts (events, change detail, breakpoint
 *   option, store, manager, plugin callback).
 *
 * The Alpine plugin adapter (`sidebarPlugin`) lands in PR 2 alongside
 * `src/plugin.ts`.
 */

// --- Controller primitives (used directly + by the future plugin) ----
export { SidebarController, createSidebar } from "./controller";
// --- Event surface ---------------------------------------------------
export type { SidebarEvents, SidebarListener } from "./events";
// --- Public types (state contracts, options, plugin callback) --------
export type {
  CreateSidebarOptions,
  SidebarAlpine,
  SidebarBreakpointOption,
  SidebarChangeDetail,
  SidebarChangeSource,
  SidebarManager,
  SidebarOnMismatch,
  SidebarPluginCallback,
  SidebarStore,
} from "./types";