/**
 * Ambient type surface for `@ailuracode/alpine-media`.
 *
 * Re-exports the public type surface so consumers can include this
 * file via the triple-slash directive and typecheck
 * `$store.media` references without pulling the runtime entrypoint.
 *
 * Per core's `global.d.ts` convention, this package does NOT
 * augment external modules. The `Alpine.Stores` augmentation that
 * earlier drafts proposed has been removed — consumers that need
 * typed `$store.media` access should declare the augmentation in
 * their own `*.d.ts` or use `Alpine<{ media: MediaStore }>` from
 * `@ailuracode/alpine-core`.
 *
 * ```ts
 * import type { MediaStore } from "@ailuracode/alpine-media";
 * ```
 */

/// <reference types="@types/alpinejs" />

export type {
  CreateMediaOptions,
  HoverCapability,
  MediaAlpine,
  MediaChangeDetail,
  MediaChangeSource,
  MediaInterval,
  MediaManager,
  MediaPluginCallback,
  MediaSnapshot,
  MediaStore,
  Orientation,
  PointerCapability,
  PrefersColorScheme,
  PrefersContrast,
} from "./types";
