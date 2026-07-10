/**
 * Ambient type surface for `@ailuracode/alpine-toggle`.
 *
 * Re-exports the public type surface so consumers can include this
 * file via the triple-slash directive and typecheck `$toggle(options)`
 * references without pulling the runtime entrypoint.
 *
 * Per core's `global.d.ts` convention, this package does NOT augment
 * external modules. The `Alpine.Magics<T>` augmentation that earlier
 * drafts proposed has been removed — consumers that need typed
 * `$toggle` access should declare the augmentation in their own
 * `*.d.ts` or import the types from
 * `@ailuracode/alpine-toggle` directly:
 *
 * ```ts
 * import type { ToggleInstance, ToggleOptions } from "@ailuracode/alpine-toggle";
 * ```
 */

/// <reference types="@types/alpinejs" />

export type {
  ToggleBinaryStates,
  ToggleChangeDetail,
  ToggleChangeSource,
  ToggleEvents,
  ToggleInstance,
  ToggleOptions,
  ToggleStatesView,
  ToggleTernaryStates,
} from "./types";
