/**
 * Alpine.js integration for `@ailuracode/alpine-accordion`.
 *
 * Thin adapter that wires {@link AccordionController} into
 * `$store.accordion` and the `$accordion` magic.
 */

import type { Alpine } from "alpinejs";
import { AccordionController } from "./controller";
import type {
  AccordionAlpine,
  AccordionPluginCallback,
  AccordionStore,
  CreateAccordionOptions,
} from "./types";

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

    // Register a minimal store first — Alpine wraps it in a reactive
    // proxy. We then override the read methods so they go through
    // the proxy (making x-text / x-show reactive), while mutation
    // methods delegate to the controller.
    const store: AccordionStore = {
      groups: {},
      register: (id, opts) => controller.register(id, opts),
      unregister: (id) => controller.unregister(id),
      registerItem: (id, itemId, disabled) => controller.registerItem(id, itemId, disabled),
      unregisterItem: (id, itemId) => controller.unregisterItem(id, itemId),
      open: (id, itemId) => controller.open(id, itemId),
      close: (id, itemId) => controller.close(id, itemId),
      toggle: (id, itemId) => controller.toggle(id, itemId),
      isOpen: () => false,
      openIds: () => [],
      activeItem: () => null,
      setActiveItem: (id, itemId) => controller.setActiveItem(id, itemId),
      handleKeydown: (id, event) => controller.handleKeydown(id, event),
      triggerProps: () => ({}),
      panelProps: () => ({}),
      destroy: () => controller.destroy(),
    };

    Alpine.store(ACCORDION_STORE_KEY, store);

    // Re-read the reactive proxy — all subsequent access goes through
    // Alpine's reactivity system.
    const reactive = () => Alpine.store(ACCORDION_STORE_KEY) as unknown as AccordionStore;

    // Override read methods to read from the reactive proxy.
    // This ensures x-text="isOpen(...)" tracks groups as a dependency.
    store.isOpen = (id, itemId) => reactive().groups[id]?.open[itemId] ?? false;
    store.openIds = (id) => {
      const open = reactive().groups[id]?.open ?? {};
      return Object.entries(open)
        .filter(([, isOpen]) => isOpen)
        .map(([gid]) => gid);
    };
    store.activeItem = (id) => reactive().groups[id]?.activeItemId ?? null;
    store.triggerProps = (id, itemId) => {
      const r = reactive();
      const open = r.isOpen(id, itemId);
      const active = r.activeItem(id) === itemId;
      return {
        "aria-expanded": open,
        "aria-controls": `${id}-panel-${itemId}`,
        id: `${id}-trigger-${itemId}`,
        tabindex: active ? 0 : -1,
      };
    };
    store.panelProps = (id, itemId) => {
      const open = reactive().isOpen(id, itemId);
      return {
        id: `${id}-panel-${itemId}`,
        role: "region",
        "aria-labelledby": `${id}-trigger-${itemId}`,
        "aria-hidden": open ? undefined : true,
      };
    };

    // Sync controller state into the reactive store on every change.
    controller.on("change", () => {
      const r = reactive();
      const controllerGroups = controller.groups;
      for (const key of Object.keys(controllerGroups)) {
        r.groups[key] = controllerGroups[key];
      }
      for (const key of Object.keys(r.groups)) {
        if (!(key in controllerGroups)) {
          delete r.groups[key];
        }
      }
    });

    Alpine.magic(ACCORDION_STORE_KEY, () => reactive());

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed accordion plugin options. */
export function accordionOptions<const T extends CreateAccordionOptions>(options: T): T {
  return options;
}
