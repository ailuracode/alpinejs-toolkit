/**
 * Alpine.js integration for `@ailuracode/alpine-theme`.
 *
 * Thin adapter that wires {@link ThemeController} into `$store.theme`
 * and the `$theme` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import type { ThemeController } from "./controller";
import { createTheme } from "./controller";
import type {
  CreateThemeOptions,
  ThemeAlpine,
  ThemeChangeDetail,
  ThemePluginCallback,
  ThemeStore,
} from "./types";

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
    const Alpine = alpine as unknown as ThemeAlpine;
    const manager = createTheme(options);

    // Re-apply the theme class/attribute when an external navigation
    // framework mutates the `<html>` element out from under us.
    const documentRef: Document | undefined =
      typeof globalThis !== "undefined" && "document" in globalThis
        ? (globalThis as { document?: Document }).document
        : undefined;
    let teardownListeners: () => void = () => undefined;
    if (documentRef && typeof documentRef.addEventListener === "function") {
      const reapply = (): void => {
        manager.apply();
      };
      const targets: ReadonlyArray<string> = ["astro:after-swap", "astro:page-load"];
      const bound: Array<[string, () => void]> = [];
      for (const type of targets) {
        documentRef.addEventListener(type, reapply);
        bound.push([type, reapply]);
      }
      teardownListeners = (): void => {
        for (const [type, listener] of bound) {
          documentRef.removeEventListener(type, listener);
        }
      };
    }

    bindControllerStore<ThemeStore, ThemeChangeDetail>({
      alpine: Alpine,
      storeKey: THEME_STORE_KEY,
      store: createThemeStore(manager),
      controller: manager,
      sync: (reactiveStore, detail) => {
        reactiveStore.current = detail.current;
        reactiveStore.system = detail.system;
        reactiveStore.resolved = detail.resolved;
      },
      beforeDestroy: [teardownListeners],
    });
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
    apply: () => {
      manager.apply();
    },
  };
}
