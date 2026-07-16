/**
 * Public entrypoint for `@ailuracode/alpine-tabs`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core/types";
export { createTabsController, createTabsStore, TabsController } from "./controller";
export type { TabsEvents } from "./events";
export { tabsOptions, tabsPlugin, tabsPlugin as default } from "./plugin";
export type {
  CreateTabsOptions,
  TabsAlpine,
  TabsChangeDetail,
  TabsChangeSource,
  TabsGroup,
  TabsGroupOptions,
  TabsOrientation,
  TabsPluginCallback,
  TabsStore,
} from "./types";
// --- Public constants ------------------------------------------------
export {
  DEFAULT_TABS_MAGIC_KEY,
  DEFAULT_TABS_STORE_KEY,
} from "./types";
