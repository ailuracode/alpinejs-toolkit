export type { Unsubscribe } from "@ailuracode/alpine-core";
export { createTheme, ThemeController } from "./controller";
export { createLocalStorageThemeStorage } from "./local-storage";
export { createMemoryThemeStorage } from "./memory-storage";
export { createThemeStore, themePlugin, themePlugin as default } from "./plugin";
export type {
  CreateThemeOptions,
  ResolvedTheme,
  ThemeAlpine,
  ThemeChangeDetail,
  ThemeChangeSource,
  ThemeDomStrategy,
  ThemeEvents,
  ThemeListener,
  ThemePluginCallback,
  ThemePreference,
  ThemeState,
  ThemeStorage,
  ThemeStore,
} from "./types";
