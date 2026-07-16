/**
 * Alpine.js integration for `@ailuracode/alpine-accordion`.
 *
 * Thin adapter that wires {@link AccordionController} into
 * `$store.accordion` and the `$accordion` magic.
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import { AccordionController } from "./controller.js";
import {
  type AccordionAlpine,
  type AccordionPluginCallback,
  type AccordionStore,
  type CreateAccordionOptions,
  DEFAULT_ACCORDION_MAGIC_KEY,
  DEFAULT_ACCORDION_STORE_KEY,
} from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateAccordionOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function accordionPlugin(options: CreateAccordionOptions = {}): AccordionPluginCallback {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_ACCORDION_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_ACCORDION_MAGIC_KEY;

  return function registerAccordion(alpine: Alpine): void {
    const Alpine = alpine as unknown as AccordionAlpine;
    const controller = new AccordionController(options.id);
    const store = { ...controller.toStore(), groups: {} };

    bridgeControllerStore<AccordionStore, AccordionController>({
      alpine: Alpine,
      storeKey,
      magicKey,
      store: store as AccordionStore,
      controller,
      packageName: "accordion",
      subscribe: (reactiveStore) => {
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

        return controller.on("change", () => {
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
      },
    });
  };
}

/** Builds typed accordion plugin options. */
export function accordionOptions<const T extends CreateAccordionOptions>(options: T): T {
  return options;
}
