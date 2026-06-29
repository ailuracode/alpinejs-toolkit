import type AlpineType from "alpinejs";
import { getQueryStore, mountQueryDevtools } from "./panel.js";
import type { QueryDevtoolsController, QueryDevtoolsPluginOptions } from "./types.js";

let activeController: QueryDevtoolsController | null = null;

/** Alpine.js devtools panel for @ailuracode/alpine-query. */
export default function queryDevtoolsPlugin(
  options: QueryDevtoolsPluginOptions = {}
): AlpineType.PluginCallback {
  return function registerQueryDevtools(Alpine) {
    if (typeof document === "undefined") {
      return;
    }

    document.addEventListener(
      "alpine:initialized",
      () => {
        activeController?.destroy();

        const store = getQueryStore(Alpine, options.storeName ?? "query");
        activeController = mountQueryDevtools({
          ...options,
          store,
        });
      },
      { once: true }
    );
  };
}

export { getQueryStore, mountQueryDevtools } from "./panel.js";
export { DEFAULT_PREFERENCES_STORAGE_KEY } from "./panel-preferences.js";
export {
  DEFAULT_TOGGLE_CORNER,
  DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  TOGGLE_CORNERS,
} from "./toggle-corner.js";
export type {
  QueryDevtoolsController,
  QueryDevtoolsMountOptions,
  QueryDevtoolsPluginOptions,
  ToggleCorner,
} from "./types.js";
