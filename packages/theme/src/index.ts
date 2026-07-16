/**
 * Public entrypoint for `@ailuracode/alpine-theme`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file MUST
 * only contain re-exports. The framework-agnostic controller lives in
 * `./controller.ts`, the Alpine integration in `./plugin.ts`, and the
 * supporting pure helpers and types live in `./types.ts` and
 * `./internal/*` (private validation, dom strategy).
 *
 * Storage adapters (`local-storage.ts`, `memory-storage.ts`) and the
 * `system-observer` helper live at the package root because they are
 * public API surface — consumers use them to plug custom storage into
 * `createTheme()` and to read the OS preference outside the manager.
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

// --- Public factory (framework-agnostic) -----------------------------
export { createTheme, ThemeController } from "./controller";
export type { Unsubscribe } from "./core-deps.js";
// --- Event surface ---------------------------------------------------
export type { ThemeEvents, ThemeListener } from "./events";
export type { LocalStorageThemeStorageOptions } from "./local-storage";
// --- Storage adapters -----------------------------------------------
export { createLocalStorageThemeStorage } from "./local-storage";
export { createMemoryThemeStorage } from "./memory-storage";
// --- Alpine integration ----------------------------------------------
export { createThemeStore, themePlugin, themePlugin as default } from "./plugin";
// --- System theme helper ---------------------------------------------
export { readSystemTheme } from "./system-observer";
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
  DEFAULT_THEME_MAGIC_KEY,
  DEFAULT_THEME_PREFERENCE,
  DEFAULT_THEME_STORAGE_KEY,
  DEFAULT_THEME_STORE_KEY,
} from "./types";
