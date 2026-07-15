/**
 * Ambient type surface for `@ailuracode/alpine-toggle`.
 *
 * Re-exports the public type surface so consumers can include this
 * file via the triple-slash directive and typecheck `$toggle(options)`
 * references without pulling the runtime entrypoint.
 *
 * Per core's `global.d.ts` convention, this package does NOT augment
 * external modules. Consumers that need typed `$toggle` access should
 * declare the augmentation in their own `*.d.ts` or import the types
 * from `@ailuracode/alpine-toggle` directly.
 */

/// <reference types="@types/alpinejs" />

export type {
  ToggleBinaryStates,
  ToggleChangeDetail,
  ToggleChangeSource,
  ToggleEvents,
  ToggleInstance,
  ToggleOptions,
  ToggleReactiveView,
  ToggleReactiveViewValue,
  ToggleStatesView,
  ToggleTernaryStates,
  Writable,
} from "./types";
