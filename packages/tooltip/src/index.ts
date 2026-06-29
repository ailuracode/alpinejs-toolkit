import type AlpineType from "alpinejs";
import { createTooltipStore, type TooltipStore } from "./store.js";

export {
  createTooltipStore,
  type TooltipInstanceOptions,
  type TooltipStore,
} from "./store.js";

/** Alpine.js tooltip plugin. Registers `$store.tooltip`. */
export default function tooltipPlugin(): AlpineType.PluginCallback {
  return function registerTooltip(Alpine) {
    Alpine.store("tooltip", createTooltipStore());
    Alpine.magic("tooltip", () => Alpine.store("tooltip"));
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      tooltip: TooltipStore;
    }
    interface Magics<T> {
      $tooltip: TooltipStore;
    }
  }
}
