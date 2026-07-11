import type AlpineType from "alpinejs";
import nanostoresQueryPlugin, { type NanostoresQueryPluginOptions } from "../nanostores/index.js";
import queryDevtoolsPlugin, { type QueryDevtoolsPluginOptions } from "./index.js";

export type QueryKitWithDevtoolsPluginOptions = NanostoresQueryPluginOptions & {
  /** Devtools panel options. Default: enabled with default panel settings. */
  devtools?: QueryDevtoolsPluginOptions;
};

/** Registers Nanostores query adapter and the Query Devtools panel. */
export default function queryKitWithDevtoolsPlugin(
  options: QueryKitWithDevtoolsPluginOptions = {}
): AlpineType.PluginCallback {
  const { devtools = {}, ...queryOptions } = options;
  const registerQuery = nanostoresQueryPlugin(queryOptions);

  return function registerQueryKitWithDevtools(Alpine) {
    registerQuery(Alpine);
    queryDevtoolsPlugin(devtools)(Alpine);
  };
}
