/**
 * Pure helpers for validating and normalizing sidebar options.
 *
 * Kept side-effect free so the controller constructor can call them
 * without touching `window` / `document`. Mirrors the structure of
 * `@ailuracode/alpine-theme`'s `internal/validation` module — same
 * separation of concerns (pure logic in `internal/`, public surface
 * in `controller.ts`).
 *
 * The public `CreateSidebarOptions.breakpoint` is `SidebarBreakpointOption`
 * (object only) per locked design decision D3. This module's
 * `coerceBreakpointOption` exists for adapter-layer coercion only —
 * not part of the public contract — and rejects input that is not a
 * structurally valid `SidebarBreakpointOption` by returning the
 * fallback.
 */

import type {
  SidebarBreakpointOption,
  SidebarOnMismatch,
} from "../types.js";

const VALID_ON_MISMATCH: readonly SidebarOnMismatch[] = ["hide", "keep"];

/**
 * Type guard for the `onMismatch` discriminator.
 */
export function isBreakpointOnMismatch(value: unknown): value is SidebarOnMismatch {
  return (
    typeof value === "string" &&
    (VALID_ON_MISMATCH as readonly string[]).includes(value)
  );
}

/**
 * Coerces an unknown value into a valid `SidebarBreakpointOption`,
 * returning `fallback` when the input is malformed.
 *
 * - When `input` is already a valid `SidebarBreakpointOption`,
 *   returns it as-is.
 * - When `input.query` is not a non-empty string or
 *   `input.onMismatch` is not `'hide' | 'keep'`, returns `fallback`.
 * - When `input` is `undefined` / `null` / non-object, returns
 *   `fallback`.
 */
export function coerceBreakpointOption(
  input: unknown,
  fallback: SidebarBreakpointOption | undefined
): SidebarBreakpointOption | undefined {
  if (input === null || typeof input !== "object") {
    return fallback;
  }

  const candidate = input as { query?: unknown; onMismatch?: unknown };
  const query = candidate.query;

  if (typeof query !== "string" || query.length === 0) {
    return fallback;
  }

  if (!isBreakpointOnMismatch(candidate.onMismatch)) {
    return fallback;
  }

  return { query, onMismatch: candidate.onMismatch };
}