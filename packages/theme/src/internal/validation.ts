/**
 * Internal validation helpers.
 *
 * The manager and storage adapters share the same predicate so an
 * invalid value persisted by a third-party script is rejected in the
 * same way regardless of which entry point reads it.
 */

import { DEFAULT_THEME_PREFERENCE, type ResolvedTheme, type ThemePreference } from "../types";

/** Narrows `value` to {@link ThemePreference}. Accepts the three documented literals. */
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Narrows `value` to {@link ResolvedTheme}. */
export function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

/** Coerces `value` into a valid {@link ThemePreference}, defaulting on garbage. */
export function coerceThemePreference(value: unknown, fallback: ThemePreference): ThemePreference {
  return isThemePreference(value) ? value : fallback;
}

/** Returns the default preference. Centralized so the fallback and the option default never drift. */
export function defaultThemePreference(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE;
}

/** Resolves `current` against `system` to a concrete color scheme. */
export function resolveTheme(current: ThemePreference, system: ResolvedTheme): ResolvedTheme {
  return current === "system" ? system : current;
}
