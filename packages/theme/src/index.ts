/**
 * Public entrypoint for `@ailuracode/alpine-theme`.
 *
 * Per `.agents/instructions/public-api.instructions.md`, this file MUST
 * only contain re-exports. The framework-agnostic controller lives in
 * `./controller.ts`, the Alpine integration in `./plugin.ts`, and the
 * supporting pure helpers and types live in `./types.ts` and
 * `./internal/*`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createTheme({ ... })` returns a manager. Use this
 *    in Blade / Livewire / vanilla TypeScript apps.
 *
 * 2. Alpine — `themePlugin({ ... })` returns an `Alpine.plugin()`
 *    callback that wires the manager into `$store.theme` and `$theme`.
 *
 * Exports are grouped by domain so consumers can scan the surface in
 * one pass: public factory → Alpine adapter → infrastructure adapters →
 * system helper → constants → types.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Public factory (framework-agnostic) -----------------------------
export { createTheme, ThemeController } from "./controller";
// --- Event surface ---------------------------------------------------
export type { ThemeEvents, ThemeListener } from "./events";
export type { LocalStorageThemeStorageOptions } from "./internal/storage/local-storage";
// --- Storage adapters -----------------------------------------------
export { createLocalStorageThemeStorage } from "./internal/storage/local-storage";
export { createMemoryThemeStorage } from "./internal/storage/memory";
// --- System theme helper ---------------------------------------------
export { readSystemTheme } from "./internal/system-observer";
// --- Alpine integration ----------------------------------------------
export { createThemeStore, themePlugin } from "./plugin";
// --- Public types (state, contracts, options) -------------------------
export type {
  CreateThemeOptions,
  ResolvedTheme,
  ThemeAlpine,
  ThemeChangeDetail,
  ThemeChangeSource,
  ThemeDomStrategy,
  ThemeManager,
  ThemePluginCallback,
  ThemePreference,
  ThemeState,
  ThemeStorage,
  ThemeStore,
} from "./types";
// --- Public constants ------------------------------------------------
export {
  DEFAULT_THEME_PREFERENCE,
  DEFAULT_THEME_STORAGE_KEY,
} from "./types";
