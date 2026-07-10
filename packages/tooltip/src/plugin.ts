/**
 * Alpine.js integration for `@ailuracode/alpine-tooltip`.
 *
 * Thin adapter that wires {@link TooltipController} into
 * `$store.tooltip` and the `$tooltip` magic.
 */

import type { Alpine } from "alpinejs";
import { TooltipController } from "./controller";
import type {
  CreateTooltipOptions,
  TooltipAlpine,
  TooltipPluginCallback,
  TooltipStore,
} from "./types";

/** Key under which the tooltip store is registered on `$store`. */
const TOOLTIP_STORE_KEY = "tooltip";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateTooltipOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function tooltipPlugin(options: CreateTooltipOptions = {}): TooltipPluginCallback {
  return function registerTooltip(alpine: Alpine): void {
    const Alpine = alpine as unknown as TooltipAlpine;
    const controller = new TooltipController(options.id);

    // Build a mutable store object that delegates to the controller.
    const store: TooltipStore = {
      instances: {} as TooltipStore["instances"],
      register: (id, opts) => controller.register(id, opts),
      unregister: (id) => controller.unregister(id),
      open: (id) => controller.open(id),
      close: (id) => controller.close(id),
      toggle: (id) => controller.toggle(id),
      isOpen: (id) => controller.isOpen(id),
      showOnHover: (id) => controller.showOnHover(id),
      hideOnHover: (id) => controller.hideOnHover(id),
      showOnFocus: (id) => controller.showOnFocus(id),
      hideOnFocus: (id) => controller.hideOnFocus(id),
      handleKeydown: (id, event) => controller.handleKeydown(id, event),
      destroy: () => controller.destroy(),
    };

    Alpine.store(TOOLTIP_STORE_KEY, store);
    const reactiveStore = Alpine.store(TOOLTIP_STORE_KEY);

    // Override isOpen to read through the reactive proxy so Alpine
    // tracks the dependency on instances[id].open.
    reactiveStore.isOpen = (id: string) => reactiveStore.instances[id]?.open ?? false;

    // Sync controller state into the reactive store on every change.
    controller.on("change", () => {
      const controllerInstances = controller.instances;
      for (const key of Object.keys(controllerInstances)) {
        reactiveStore.instances[key] = controllerInstances[key];
      }
      for (const key of Object.keys(reactiveStore.instances)) {
        if (!(key in controllerInstances)) {
          delete reactiveStore.instances[key];
        }
      }
    });

    Alpine.magic(TOOLTIP_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed tooltip plugin options. */
export function tooltipOptions<const T extends CreateTooltipOptions>(options: T): T {
  return options;
}
