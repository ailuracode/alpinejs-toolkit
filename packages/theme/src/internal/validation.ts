import type { ResolvedTheme, ThemePreference } from "../types";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function coerceThemePreference(value: unknown, fallback: ThemePreference): ThemePreference {
  return isThemePreference(value) ? value : fallback;
}

export function defaultThemePreference(): ThemePreference {
  return "system";
}

export function resolveTheme(current: ThemePreference, system: ResolvedTheme): ResolvedTheme {
  return current === "system" ? system : current;
}
