/**
 * Ambient type surface for `@ailuracode/alpine-child`.
 *
 * Re-exports the public type surface so consumers can include this
 * file via the triple-slash directive and typecheck `x-child`
 * references without pulling the runtime entrypoint.
 *
 * Per core's `global.d.ts` convention, this package does NOT augment
 * external modules — the `x-child` directive is identified by its
 * attribute name, not by an `Alpine.*` namespace entry. Consumers that
 * need typed access to the unwrap machinery should import the types
 * from `@ailuracode/alpine-child` directly:
 *
 * ```ts
 * import type {
 *   ChildDirectiveConfig,
 *   ChildMergeMode,
 *   ChildPluginOptions,
 * } from "@ailuracode/alpine-child";
 * ```
 */

/// <reference types="@types/alpinejs" />

export type {
  ChildDirectiveConfig,
  ChildMergeMode,
  ChildMorphOptions,
  ChildPluginCallback,
  ChildPluginOptions,
} from "./types.js";
