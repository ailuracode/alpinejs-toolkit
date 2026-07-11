/**
 * Development-only entry for Query Devtools.
 *
 * Import from `@ailuracode/alpine-query-kit/devtools` — not from the main
 * package entry, which stays headless and omits styled UI from its bundle.
 */

export {
  DEFAULT_PREFERENCES_STORAGE_KEY,
  DEFAULT_TOGGLE_CORNER,
  DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  default as queryDevtoolsPlugin,
  getQueryStore,
  mountQueryDevtools,
  TOGGLE_CORNERS,
} from "./devtools/index.js";
export type { QueryKitWithDevtoolsPluginOptions } from "./devtools/kit-with-devtools.js";
export { default as queryKitWithDevtoolsPlugin } from "./devtools/kit-with-devtools.js";
export type {
  QueryDevtoolsController,
  QueryDevtoolsMountOptions,
  QueryDevtoolsPluginOptions,
  ToggleCorner,
} from "./devtools/types.js";
