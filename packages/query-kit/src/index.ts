import type AlpineType from "alpinejs";

export * from "@ailuracode/alpine-query";
export {
  DEFAULT_PREFERENCES_STORAGE_KEY,
  DEFAULT_TOGGLE_CORNER,
  DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  default as queryDevtoolsPlugin,
  getQueryStore,
  mountQueryDevtools,
  type QueryDevtoolsController,
  type QueryDevtoolsMountOptions,
  type QueryDevtoolsPluginOptions,
  TOGGLE_CORNERS,
  type ToggleCorner,
} from "./devtools/index.js";
export {
  createAlpineNanostoresAdapter,
  default as nanostoresQueryPlugin,
  directivePlugin,
  magicPlugin,
  modelDirectivePlugin,
  NanoStores,
  type NanostoresQueryPluginOptions,
  nanostoresQueryAdapter,
} from "./nanostores/index.js";

import queryDevtoolsPlugin, { type QueryDevtoolsPluginOptions } from "./devtools/index.js";
import nanostoresQueryPlugin, { type NanostoresQueryPluginOptions } from "./nanostores/index.js";

export type QueryKitPluginOptions = NanostoresQueryPluginOptions & {
  /** Devtools panel options. Pass `false` to skip devtools registration. */
  devtools?: QueryDevtoolsPluginOptions | false;
};

/** Registers Nanostores query adapter and optional devtools panel. */
export default function queryKitPlugin(
  options: QueryKitPluginOptions = {}
): AlpineType.PluginCallback {
  const { devtools = {}, ...queryOptions } = options;
  const registerQuery = nanostoresQueryPlugin(queryOptions);

  return function registerQueryKit(Alpine) {
    registerQuery(Alpine);

    if (devtools !== false) {
      queryDevtoolsPlugin(devtools)(Alpine);
    }
  };
}
