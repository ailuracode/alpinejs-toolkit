/**
 * Public type contracts for `@ailuracode/alpine-theme`.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — changes to a field name
 * or type are breaking changes.
 */

import type { Alpine, PluginCallback, SingletonScope, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** The values the user can select. `'system'` defers to the OS preference. */
export type ThemePreference = "light" | "dark" | "system";

/** The effective theme applied to the page. Never `'system'`. */
export type ResolvedTheme = "light" | "dark";

/** Default preference used when nothing is persisted and the runtime is SSR. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

/** Default `localStorage` key used by the bundled adapter. */
export const DEFAULT_THEME_STORAGE_KEY = "theme";

/** Re-exported so consumers can grab every theme type from one path. */
export type { Unsubscribe };

/**
 * Source of a theme change — informs subscribers why a transition
 * happened. Single source of truth for the `change` event's `source`
 * field; adding a new member ripples through every consumer so
 * exhaustiveness is enforced by TypeScript.
 *
 * Public: changing a member is a breaking change for anyone
 * branching on `detail.source`.
 */
export type ThemeChangeSource = "initialization" | "user" | "system" | "storage" | "reset";

/**
 * Structured state exposed by {@link ThemeManager}. All three fields are
 * independently observable: `current` is what the user picked, `system`
 * is what the OS reports, and `resolved` is the effective value applied
 * to the page.
 *
 * Example: `current='system'`, `system='dark'`, `resolved='dark'`.
 */
export interface ThemeState {
  readonly current: ThemePreference;
  readonly system: ResolvedTheme;
  readonly resolved: ResolvedTheme;
}

/**
 * Structured payload delivered to subscribers on every relevant
 * transition. Extends {@link ThemeState} so consumers always receive
 * the current trio (`current` / `system` / `resolved`) alongside the
 * `source` discriminator and the previous snapshot.
 */
export interface ThemeChangeDetail extends ThemeState {
  /** Why the change happened. */
  readonly source: ThemeChangeSource;
  /** Previous state — `null` only on the first emit (initialization). */
  readonly previous: ThemeState | null;
}

/**
 * Strategy the manager uses to apply the resolved theme to the DOM.
 *
 * - `'class'` — adds `darkClass` (or `lightClass`) to `target` based on
 *   the resolved value.
 * - `'attribute'` — sets `dataAttribute` on `target` to the resolved value.
 * - `'none'` — skips DOM application entirely (headless mode).
 */
export type ThemeDomStrategy = "class" | "attribute" | "none";

/**
 * Storage adapter contract.
 *
 * The default {@link createLocalStorageThemeStorage} adapter implements
 * this interface on top of `window.localStorage`. Alternative adapters
 * (cookies, in-memory, server-supplied) can be plugged in without
 * touching the manager.
 *
 * The contract returns the typed {@link ThemePreference} (or `null` when
 * nothing / an invalid value is stored) and accepts the same typed value.
 * Parsing / validation happens inside the adapter so the manager never
 * deals with raw strings.
 */
export interface ThemeStorage {
  /** Reads the persisted preference. Returns `null` when nothing is stored. */
  get(): ThemePreference | null;
  /** Persists `value`. No-op when the API is unavailable. */
  set(value: ThemePreference): void;
  /** Removes the persisted value. */
  remove(): void;
  /**
   * Optional subscription hook. The manager calls this when the
   * adapter supports cross-instance change notifications (cross-tab,
   * in-memory observers). Always return an unsubscribe function — a
   * no-op is fine when the runtime cannot subscribe.
   *
   * The listener receives `null` when the adapter's underlying store
   * is cleared (another tab called `removeItem`, the in-memory
   * adapter's `remove()` ran). The manager treats `null` as a
   * "fall back to the configured default" signal and emits a
   * `change` event with `source: 'storage'`.
   */
  subscribe?(listener: (next: ThemePreference | null) => void): Unsubscribe;
}

/** Options accepted by {@link createTheme}. */
export interface CreateThemeOptions {
  /**
   * Stable identifier exposed via {@link ThemeController.id}. When
   * omitted, the controller generates one from the constructor name.
   */
  readonly id?: string;
  /**
   * Preference applied when no valid value is persisted. Default:
   * {@link DEFAULT_THEME_PREFERENCE} (`'system'`).
   */
  readonly defaultTheme?: ThemePreference;
  /**
   * Persistence adapter. Default: a {@link createLocalStorageThemeStorage}
   * adapter with the default key. Pass an in-memory / noop adapter to
   * disable persistence.
   */
  readonly storage?: ThemeStorage;
  /** DOM strategy. Default: `'class'`. */
  readonly strategy?: ThemeDomStrategy;
  /**
   * CSS class added to `target` when the resolved theme is `'dark'`.
   * Only used when `strategy: 'class'`. Default: `'dark'`.
   */
  readonly darkClass?: string;
  /**
   * CSS class added to `target` when the resolved theme is `'light'`.
   * Only used when `strategy: 'class'`. Default: `'light'`.
   */
  readonly lightClass?: string;
  /**
   * DOM attribute set to the resolved value when
   * `strategy: 'attribute'`. Default: `'data-theme'`.
   */
  readonly attribute?: string;
  /**
   * Element the strategy mutates. Default: `document.documentElement`
   * when `document` is present; otherwise the strategy is skipped.
   */
  readonly target?: HTMLElement | null;
  /**
   * When `true` (default), the manager listens to the OS
   * `prefers-color-scheme` change events. Disabling freezes the
   * resolved value to whatever the OS reported on init.
   */
  readonly watchSystem?: boolean;
  /**
   * When `true` (default) and the storage adapter exposes a
   * `subscribe()` method, the manager reacts to cross-tab storage
   * changes. The default localStorage adapter enables this.
   */
  readonly crossTab?: boolean;
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly via
   * `createSingletonScope()`.
   */
  readonly scope?: SingletonScope;
}

/** Public, framework-agnostic manager returned by {@link createTheme}. */
export interface ThemeManager {
  /** Current user preference. */
  readonly current: ThemePreference;
  /** OS-reported theme — updated when the system preference changes. */
  readonly system: ResolvedTheme;
  /** Effective theme applied to the DOM. */
  readonly resolved: ResolvedTheme;
  /** Read-only snapshot of the manager's state. */
  get(): ThemeState;
  /** Sets a new preference. Persists, recomputes, and applies. */
  set(value: ThemePreference): void;
  /**
   * Toggles between `light` and `dark` based on the resolved theme.
   * Calling `toggle()` creates an explicit user preference — the
   * manager does NOT return to `'system'`.
   */
  toggle(): void;
  /** Resets to the configured default and removes the persisted value. */
  reset(): void;
  /**
   * Re-applies the currently resolved theme to the DOM, bypassing
   * the strategy's last-applied cache. Use after external DOM
   * mutations (Astro View Transitions, browser extensions, hot
   * reloads) that may have removed the class or attribute the
   * strategy set on mount.
   *
   * Does not modify internal state, persistence, or emit a `change`
   * event — purely a DOM re-sync.
   */
  apply(): void;
  /**
   * Subscribes to a `change` event. Returns an unsubscribe function.
   * Detail payload carries `current`, `system`, `resolved`, `source`,
   * and `previous` (null on the initialization event).
   */
  on(event: "change", listener: (detail: ThemeChangeDetail) => void): Unsubscribe;
  /** Tears down listeners and releases references. Idempotent. */
  destroy(): void;
}

/**
 * Typed view of `Alpine` the theme plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with the `theme`
 * store mapped to its concrete {@link ThemeStore} shape. That gives
 * `alpine.store("theme")` a return type of `ThemeStore` without any
 * manual overload declarations — every other name still goes through
 * the generic `Alpine.store` inherited from the base.
 *
 * The `cleanup?` member is Alpine-specific (older versions don't
 * expose it) and is layered on as an intersection so the integration
 * can guard every call with a `typeof === "function"` check.
 *
 * A real `Alpine` runtime is assignable to `ThemeAlpine` without a
 * cast because the toolkit's `Alpine<Stores>` only ADDS overloads.
 */
export type ThemeAlpine = Alpine<{ theme: ThemeStore }> & {
  /**
   * Forwarded through Alpine's cleanup mechanism when available.
   * Older Alpine versions don't expose `cleanup`; the integration
   * guards every call with a `typeof === "function"` check.
   */
  cleanup?(callback: () => void): void;
};

/** Alpine-facing store surface. The integration fills it from a manager. */
export interface ThemeStore {
  current: ThemePreference;
  system: ResolvedTheme;
  resolved: ResolvedTheme;
  set(value: ThemePreference): void;
  toggle(): void;
  reset(): void;
  /**
   * Re-applies the currently resolved theme to the DOM. Useful in
   * Alpine `$store.theme.apply()` expressions after navigation
   * events from routers that mutate `<html>` externally.
   */
  apply(): void;
}

/**
 * `Alpine.plugin()` callback signature.
 *
 * Typed against the base {@link AlpineBase} via the toolkit's
 * {@link PluginCallback} generic, which keeps this alias structurally
 * assignable to `Base.PluginCallback`. That lets `themePlugin(...)`
 * drop straight into `Alpine.plugin(...)` without a cast. The plugin
 * narrows the runtime instance to {@link ThemeAlpine} inside the
 * function body for typed access to the `"theme"` store / magic.
 */
export type ThemePluginCallback = PluginCallback<AlpineBase>;
