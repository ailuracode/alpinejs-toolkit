import type { Alpine, PluginCallback, SingletonScope, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

export type ThemePreference = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

export type { Unsubscribe };

export type ThemeChangeSource = "initialization" | "user" | "system" | "storage" | "reset";

export interface ThemeState {
  readonly current: ThemePreference;
  readonly system: ResolvedTheme;
  readonly resolved: ResolvedTheme;
}

export interface ThemeChangeDetail extends ThemeState {
  readonly source: ThemeChangeSource;
  readonly previous: ThemeState | null;
}

export interface ThemeEvents extends Record<string, unknown> {
  change: ThemeChangeDetail;
}

export type ThemeListener = (detail: ThemeChangeDetail) => void;

export type ThemeDomStrategy = "class" | "attribute" | "none";

export interface ThemeStorage {
  get(): ThemePreference | null;
  set(value: ThemePreference): void;
  remove(): void;
  subscribe?(listener: (next: ThemePreference | null) => void): Unsubscribe;
}

export interface CreateThemeOptions {
  readonly id?: string;
  readonly defaultTheme?: ThemePreference;
  readonly storage?: ThemeStorage;
  readonly strategy?: ThemeDomStrategy;
  readonly darkClass?: string;
  readonly lightClass?: string;
  readonly attribute?: string;
  readonly target?: HTMLElement | null;
  readonly watchSystem?: boolean;
  readonly crossTab?: boolean;
  readonly scope?: SingletonScope;
  readonly storeKey?: string;
  readonly magicKey?: string;
  readonly reapplyEvents?: readonly string[];
}

export type ThemeAlpine = Alpine<{ theme: ThemeStore }>;

export interface ThemeStore {
  current: ThemePreference;
  system: ResolvedTheme;
  resolved: ResolvedTheme;
  set(value: ThemePreference): void;
  toggle(): void;
  reset(): void;
  apply(): void;
}

export type ThemePluginCallback = PluginCallback<AlpineBase>;
