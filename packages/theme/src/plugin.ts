/**
 * Alpine.js integration for `@ailuracode/alpine-theme`.
 *
 * Thin adapter that wires {@link ThemeController} into `$store.theme`
 * and the `$theme` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import type { ThemeController } from "./controller";
import { createTheme } from "./controller";
import {
  type CreateThemeOptions,
  DEFAULT_THEME_MAGIC_KEY,
  DEFAULT_THEME_STORE_KEY,
  type ThemeAlpine,
  type ThemePluginCallback,
  type ThemeStore,
} from "./types";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateThemeOptions} to configure {@link ThemeController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function themePlugin(options: CreateThemeOptions = {}): ThemePluginCallback {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_THEME_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_THEME_MAGIC_KEY;

  return function registerTheme(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `ThemeAlpine`.
    const Alpine = alpine as unknown as ThemeAlpine;
    // `createTheme()` already mounts; the controller's constructor
    // stays pure (no `window` / `document` / `localStorage` access).
    const manager = createTheme(options);
    const store = createThemeStore(manager);

    // Re-apply the theme class/attribute when an external navigation
    // framework mutates the `<html>` element out from under us.
    // Most notably: Astro View Transitions preserves `<html>` across
    // navigations but lets its diff sync attributes against the new
    // page's `<html>` markup, which strips the `dark` / `light` /
    // `data-theme` value our strategy set on initial mount. The
    // strategy's internal cache then thinks the DOM is already in
    // sync and skips the re-apply on the next `change` event.
    //
    // Both events are guarded with `typeof` and `addEventListener`
    // checks so non-browser / non-Astro consumers pay nothing.
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

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      magicKey,
      store,
      controller: manager,
      packageName: "theme",
      subscribe: (reactiveStore) =>
        manager.on("change", (detail) => {
          reactiveStore.current = detail.current;
          reactiveStore.system = detail.system;
          reactiveStore.resolved = detail.resolved;
        }),
      onCleanup: teardownListeners,
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
