export * from "@ailuracode/alpine-query";
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

import nanostoresQueryPlugin from "./nanostores/index.js";

/** Headless query kit plugin (Nanostores adapter only). */
export { nanostoresQueryPlugin as queryKitPlugin };

/** Default export — cache + Nanostores adapter without devtools UI. */
export default nanostoresQueryPlugin;
