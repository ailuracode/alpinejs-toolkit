/**
 * Public entrypoint for `@ailuracode/alpine-tabs`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
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
