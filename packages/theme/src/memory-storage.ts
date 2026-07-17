import type { Unsubscribe } from "@ailuracode/alpine-core";
import { createMemoryAdapter } from "@ailuracode/alpine-ui";
import type { ThemePreference, ThemeStorage } from "./types";

export function createMemoryThemeStorage(
  initial: ThemePreference | null = null
): ThemeStorage & { subscribe: (listener: (next: ThemePreference | null) => void) => Unsubscribe } {
  return createMemoryAdapter<ThemePreference>({ initial });
}
