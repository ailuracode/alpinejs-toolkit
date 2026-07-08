/**
 * Language tag utilities for `@ailuracode/alpine-lang`.
 *
 * Pure functions — no side effects, no `navigator` access. Re-exported
 * from the package entrypoint so consumers can build their own stores
 * or storage adapters on top of the same primitives the controller
 * uses internally.
 */

/** Lower-case and normalize separators to `-`. Idempotent. */
export function normalizeLanguageTag(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

/**
 * Split a language tag into its `[base, region | null]` parts.
 * Does **not** mutate case — preserves BCP 47 casing so callers can
 * still distinguish `"pt-BR"` from `"pt-br"` when they need to.
 */
export function parseLanguageTag(tag: string): { base: string; region: string | null } {
  const sanitized = tag.trim().replace(/_/g, "-");
  if (sanitized === "") {
    return { base: "", region: null };
  }

  const segments = sanitized.split("-");
  const base = segments[0] ?? "";
  const region = segments.length > 1 ? (segments[1] ?? null) : null;

  return { base, region };
}
