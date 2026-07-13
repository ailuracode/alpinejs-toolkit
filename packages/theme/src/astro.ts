/**
 * Astro View Transitions integration for `@ailuracode/alpine-theme`.
 *
 * Re-applies the resolved theme after Astro mutates `<html>` during
 * client-side navigations. Import from `@ailuracode/alpine-theme/astro`
 * instead of the main entry when using Astro View Transitions.
 */

import { themePlugin } from "./plugin.js";
import type { CreateThemeOptions, ThemePluginCallback } from "./types.js";
import { ASTRO_THEME_REAPPLY_EVENTS } from "./types.js";

export { ASTRO_THEME_REAPPLY_EVENTS };

/**
 * Alpine plugin factory with Astro View Transition re-apply listeners
 * preconfigured. Accepts the same {@link CreateThemeOptions} as
 * {@link themePlugin}.
 */
export function astroThemePlugin(options: CreateThemeOptions = {}): ThemePluginCallback {
  return themePlugin({
    ...options,
    reapplyEvents: ASTRO_THEME_REAPPLY_EVENTS,
  });
}

export { astroThemePlugin as default };
