import type { Unsubscribe } from "@ailuracode/alpine-core";
import { createLocalStorageAdapter } from "@ailuracode/alpine-ui";
import { isThemePreference } from "./internal/validation";
import type { ThemePreference, ThemeStorage } from "./types";

export function createLocalStorageThemeStorage(
  options: { readonly key?: string; readonly crossTab?: boolean } = {}
): ThemeStorage & { subscribe: (listener: (next: ThemePreference | null) => void) => Unsubscribe } {
  return createLocalStorageAdapter<ThemePreference>({
    key: options.key ?? "theme",
    crossTab: options.crossTab !== false,
    parse: (raw) => (isThemePreference(raw) ? raw : null),
    serialize: (value) => value,
  });
}
