/**
 * Portal root helpers.
 *
 * - {@link createPortalRoot} — SSR-safe portal container factory
 *   (returns `null` under Node SSR, otherwise returns the existing
 *   element or creates / appends a new one).
 *
 * The portal primitive is feature-agnostic — Alpine consumers compose
 * it via `:style="{ zIndex: ... }"` bindings or `x-teleport`
 * selectors. It does NOT ship a plugin.
 */

export { createPortalRoot } from "./create-portal-root.js";
export type { PortalRootOptions } from "./types.js";
