import type AlpineType from "alpinejs";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeResolved = "light" | "dark";

export interface ThemeChangePayload {
  mode: ThemeMode;
  resolved: ThemeResolved;
}

export interface ThemePluginOptions {
  storageKey?: string;
  onChange?: (payload: ThemeChangePayload) => void;
}

export interface ThemeStore {
  mode: ThemeMode;
  resolved: ThemeResolved;
  is(name: ThemeMode): boolean;
  readonly isLight: boolean;
  readonly isDark: boolean;
  readonly isSystem: boolean;
  isResolved(name: ThemeResolved): boolean;
  readonly isResolvedLight: boolean;
  readonly isResolvedDark: boolean;
  set(mode: ThemeMode): void;
  cycle(): void;
  refresh(): boolean;
}

const MODES = ["light", "dark", "system"] as const;

type ThemeConfig = {
  storageKey: string;
  onChange?: (payload: ThemeChangePayload) => void;
};

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (MODES as readonly string[]).includes(value);
}

function getSystemTheme(): ThemeResolved {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ThemeResolved {
  return mode === "system" ? getSystemTheme() : mode;
}

function loadMode(storageKey: string): ThemeMode {
  const saved = localStorage.getItem(storageKey);
  return isThemeMode(saved) ? saved : "system";
}

function notify(config: ThemeConfig, mode: ThemeMode, resolved: ThemeResolved): void {
  config.onChange?.({ mode, resolved });
}

function bootstrap(config: ThemeConfig): { mode: ThemeMode; resolved: ThemeResolved } {
  const mode = loadMode(config.storageKey);
  const resolved = resolveTheme(mode);
  notify(config, mode, resolved);
  return { mode, resolved };
}

/** Alpine.js theme plugin. Registers `$store.theme`. */
export default function themePlugin(options: ThemePluginOptions = {}): AlpineType.PluginCallback {
  const config: ThemeConfig = {
    storageKey: options.storageKey ?? "theme",
    onChange: options.onChange,
  };

  const initialTheme = bootstrap(config);

  return function registerTheme(Alpine) {
    const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const themeStore: ThemeStore = {
      mode: initialTheme.mode,
      resolved: initialTheme.resolved,

      is(name: ThemeMode) {
        return this.mode === name;
      },

      get isLight() {
        return this.mode === "light";
      },

      get isDark() {
        return this.mode === "dark";
      },

      get isSystem() {
        return this.mode === "system";
      },

      isResolved(name: ThemeResolved) {
        return this.resolved === name;
      },

      get isResolvedLight() {
        return this.resolved === "light";
      },

      get isResolvedDark() {
        return this.resolved === "dark";
      },

      set(mode: ThemeMode) {
        if (!MODES.includes(mode) || this.mode === mode) {
          return;
        }

        this.mode = mode;
        localStorage.setItem(config.storageKey, mode);
        this.refresh();
      },

      cycle() {
        const index = MODES.indexOf(this.mode);
        this.set(MODES[(index + 1) % MODES.length]);
      },

      refresh() {
        const resolved = resolveTheme(this.mode);
        if (this.resolved === resolved) {
          return false;
        }

        this.resolved = resolved;
        notify(config, this.mode, resolved);
        return true;
      },
    };

    Alpine.store("theme", themeStore);

    systemQuery.addEventListener("change", () => {
      if (themeStore.isSystem) {
        themeStore.refresh();
      }
    });
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      theme: ThemeStore;
    }
  }
}
