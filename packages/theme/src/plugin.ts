/**
 * Alpine.js integration for `@ailuracode/alpine-theme`.
 *
 * Thin adapter that wires {@link ThemeController} into `$store.theme`
 * and the `$theme` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import type { Alpine } from "alpinejs";
import type { ThemeController } from "./controller";
import { createTheme } from "./controller";
import type { CreateThemeOptions, ThemeAlpine, ThemePluginCallback, ThemeStore } from "./types";

/** Key under which the theme store is registered on `$store`. */
const THEME_STORE_KEY = "theme";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateThemeOptions} to configure {@link ThemeController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function themePlugin(options: CreateThemeOptions = {}): ThemePluginCallback {
  return function registerTheme(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `ThemeAlpine`.
    const Alpine = alpine as unknown as ThemeAlpine;
    // `createTheme()` already mounts; the controller's constructor
    // stays pure (no `window` / `document` / `localStorage` access).
    const manager = createTheme(options);
    const store = createThemeStore(manager);
    Alpine.store(THEME_STORE_KEY, store);
    // Alpine wraps the value in a reactive proxy on registration.
    // Re-target the subscription so mutations land on the proxy, not
    // on the unwrapped original — otherwise `x-text` bindings on the
    // `$theme` magic / `$store.theme` never re-render. We cache the
    // proxy so the `$theme` magic returns the SAME reference instead
    // of forcing Alpine to re-resolve the store on every access.
    const reactiveStore = Alpine.store(THEME_STORE_KEY);
    manager.on("change", (detail) => {
      reactiveStore.current = detail.current;
      reactiveStore.system = detail.system;
      reactiveStore.resolved = detail.resolved;
    });
    Alpine.magic(THEME_STORE_KEY, () => reactiveStore);

    // Forward destroy() through Alpine's cleanup mechanism when available.
    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => manager.destroy());
    }
  };
}

/**
 * Builds the {@link ThemeStore} Alpine exposes through `$store.theme`.
 * The store's reads delegate to the manager; mutations go through the
 * manager's semantic commands.
 *
 * Inline construction (no `as ThemeStore` cast, no seed/bind helpers)
 * because the four observable fields plus the three commands are
 * enough to exhaustively describe the object. Splitting helpers
 * would add indirection without buying anything.
 *
 * Standalone consumers (non-Alpine) can subscribe themselves and
 * forward updates the same way the adapter does.
 */
export function createThemeStore(manager: ThemeController): ThemeStore {
  return {
    current: manager.current,
    system: manager.system,
    resolved: manager.resolved,
    set: (value) => {
      manager.set(value);
    },
    toggle: () => {
      manager.toggle();
    },
    reset: () => {
      manager.reset();
    },
  };
}
