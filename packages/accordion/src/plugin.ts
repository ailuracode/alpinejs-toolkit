import type AlpineType from "alpinejs";
import {
  type AccordionController,
  type AccordionStore,
  createAccordionController,
} from "./controller.js";

export {
  type AccordionController,
  type AccordionGroupOptions,
  type AccordionMode,
  type AccordionStore,
  createAccordionController,
  createAccordionStore,
} from "./controller.js";

/** Alpine.js accordion plugin. Registers `$store.accordion`. */
export default function accordionPlugin(): AlpineType.PluginCallback {
  return function registerAccordion(Alpine) {
    const controller: AccordionController = createAccordionController();
    const store: AccordionStore = controller;
    Alpine.store("accordion", store);
    Alpine.magic("accordion", () => Alpine.store("accordion"));
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      accordion: AccordionStore;
    }
    interface Magics<T> {
      $accordion: AccordionStore;
    }
  }
}
