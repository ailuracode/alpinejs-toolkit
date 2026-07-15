/**
 * Public type contracts for `@ailuracode/alpine-child`.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — renaming a field or
 * changing a variant is a breaking change.
 *
 * The directive is intentionally minimal: one merge mode per element,
 * no events, no state. The types here document the entire public surface
 * besides the runtime functions in `./controller` and the Alpine glue
 * in `./plugin`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/**
 * How wrapper attributes interact with the first element child during the
 * unwrap pass.
 *
 * - `'default'` — `class` and `style` merge token/property lists with
 *   child tokens winning on conflict; other attributes copy only when
 *   missing on the child. Existing child `id`, `aria-*`, and `data-*`
 *   attributes always win.
 * - `'merge'` — explicit alias for `'default'`. Surfaced via the
 *   `.merge` modifier; reserved as a distinct variant so future
 *   semantics (e.g. deep attribute merging) can branch on it without
 *   breaking the modifier contract.
 * - `'replace'` — wrapper values overwrite child values on conflict.
 *   `class` and `style` still merge token/property lists.
 */
export type ChildMergeMode = "default" | "merge" | "replace";

/**
 * Parsed `x-child` directive configuration extracted from the wrapper's
 * attributes. Produced by `parseChildDirective` in `./controller`.
 */
export interface ChildDirectiveConfig {
  readonly mode: ChildMergeMode;
}

/**
 * Options accepted by {@link childPlugin}. The directive currently has
 * no runtime knobs beyond what the modifiers express, so the options
 * surface is empty by design — reserved as the public seam for future
 * cross-cutting configuration (e.g. warning sinks, scoped mutation
 * observers, debug logging).
 */
export interface ChildPluginOptions {
  readonly id?: string;
  /**
   * `x-child` directive key the Alpine plugin registers under. Defaults
   * to {@link DEFAULT_CHILD_DIRECTIVE_KEY}. Set when the host already
   * owns a `child` directive or another toolkit plugin would collide
   * on that name — the rename avoids the collision without touching
   * the unwrap pass or attribute transfer helpers.
   */
  readonly directiveKey?: string;
}

/** Default `x-child` directive key registered by {@link childPlugin}. */
export const DEFAULT_CHILD_DIRECTIVE_KEY = "child";

/**
 * Typed view of `Alpine` the child plugin uses internally.
 *
 * Adds the `morph(el, html, options)` helper from `@alpinejs/morph` on
 * top of the toolkit's {@link Alpine} generic. The morph function is
 * only present when consumers register `Alpine.plugin(morph)` before
 * `childPlugin(...)`; the plugin runtime-checks its presence and warns
 * otherwise. The toolkit's `Alpine<Stores>` only ADDS overloads, so a
 * real `Alpine` runtime is assignable to this view without a cast.
 */
export type ChildAlpine = Alpine<Record<string, never>> & {
  /**
   * Forwarded from `@alpinejs/morph`. The plugin reads this property at
   * runtime and falls back with a warning when it is absent.
   */
  morph?(el: Element, newHtml: string | Element, options?: ChildMorphOptions): Element;
};

/** Subset of `Alpine.morph` options the plugin reads. */
export interface ChildMorphOptions {
  readonly added?: (node: Node) => void;
}

/**
 * `Alpine.plugin()` callback signature.
 *
 * Typed against the base `Alpine` via the toolkit's `PluginCallback`
 * generic so `childPlugin(...)` drops straight into `Alpine.plugin(...)`
 * without a cast.
 */
export type ChildPluginCallback = PluginCallback<AlpineBase>;
