/**
 * Ambient type surface for `@ailuracode/alpine-sidebar`.
 *
 * Re-exports the public type surface so consumers can include this
 * file via the triple-slash directive and typecheck `$store.sidebar`
 * / `$sidebar` references without pulling the runtime entrypoint.
 *
 * Per `.agents/instructions/typescript.instructions.md`, this file
 * preserves the existing `Alpine.Stores` + `Alpine.Magics<T>`
 * augmentation from the v1 package so consumers that consumed the
 * augmentation via the bundled `dist/global.d.ts` continue to
 * typecheck without edits.
 */

/// <reference types="@types/alpinejs" />

import type { SidebarStore } from "./types.js";

declare global {
  namespace Alpine {
    interface Stores {
      sidebar: SidebarStore;
    }
    interface Magics<T> {
      $sidebar: SidebarStore;
    }
  }
}

export type { SidebarEvents, SidebarListener } from "./events.js";
export type {
  SidebarAlpine,
  SidebarBreakpointOption,
  SidebarChangeDetail,
  SidebarChangeSource,
  SidebarManager,
  SidebarOnMismatch,
  SidebarPluginCallback,
  SidebarStore,
} from "./types.js";
