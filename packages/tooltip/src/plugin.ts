import type AlpineType from "alpinejs";
import {
  createTooltipController,
  type TooltipController,
  type TooltipStore,
} from "./controller.js";

export {
  createTooltipController,
  createTooltipStore,
  type TooltipController,
  type TooltipInstanceOptions,
  type TooltipStore,
} from "./controller.js";

/** Alpine.js tooltip plugin. Registers `$store.tooltip`. */
export default function tooltipPlugin(): AlpineType.PluginCallback {
  return function registerTooltip(Alpine) {
    const controller: TooltipController = createTooltipController();
    const store: TooltipStore = controller;
    Alpine.store("tooltip", store);
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
