/**
 * Alpine.js integration for `@ailuracode/alpine-accordion`.
 *
 * Thin adapter that wires {@link AccordionController} into
 * `$store.accordion` and the `$accordion` magic.
 */

import type { Alpine } from "alpinejs";
import { AccordionController } from "./controller.js";
import type { AccordionAlpine, AccordionPluginCallback, CreateAccordionOptions } from "./types.js";

/** Key under which the accordion store is registered on `$store`. */
const ACCORDION_STORE_KEY = "accordion";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateAccordionOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function accordionPlugin(options: CreateAccordionOptions = {}): AccordionPluginCallback {
  return function registerAccordion(alpine: Alpine): void {
    const Alpine = alpine as unknown as AccordionAlpine;
    const controller = new AccordionController(options.id);
    const store = { ...controller.toStore(), groups: {} };
    Alpine.store(ACCORDION_STORE_KEY, store);
    const reactiveStore = Alpine.store(ACCORDION_STORE_KEY);

    reactiveStore.isOpen = (id, itemId) => reactiveStore.groups[id]?.open[itemId] ?? false;
    reactiveStore.openIds = (id) => {
      const open = reactiveStore.groups[id]?.open ?? {};
      return Object.entries(open)
        .filter(([, isOpen]) => isOpen)
        .map(([itemId]) => itemId);
    };
    reactiveStore.activeItem = (id) => reactiveStore.groups[id]?.activeItemId ?? null;
    reactiveStore.triggerProps = (id, itemId) => {
      const open = reactiveStore.isOpen(id, itemId);
      const active = reactiveStore.activeItem(id) === itemId;
      return {
        "aria-expanded": open,
        "aria-controls": `${id}-panel-${itemId}`,
        id: `${id}-trigger-${itemId}`,
        tabindex: active ? 0 : -1,
      };
    };
    reactiveStore.panelProps = (id, itemId) => {
      const open = reactiveStore.isOpen(id, itemId);
      return {
        id: `${id}-panel-${itemId}`,
        role: "region",
        "aria-labelledby": `${id}-trigger-${itemId}`,
        "aria-hidden": open ? undefined : true,
      };
    };

    controller.on("change", () => {
      const controllerGroups = controller.snapshotGroups();
      for (const key of Object.keys(controllerGroups)) {
        reactiveStore.groups[key] = controllerGroups[key];
      }
      for (const key of Object.keys(reactiveStore.groups)) {
        if (!(key in controllerGroups)) {
          delete reactiveStore.groups[key];
        }
      }
    });

    Alpine.magic(ACCORDION_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed accordion plugin options. */
export function accordionOptions<const T extends CreateAccordionOptions>(options: T): T {
  return options;
}
