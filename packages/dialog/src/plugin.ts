/**
 * Alpine.js integration for `@ailuracode/alpine-dialog`.
 *
 * Thin adapter that wires {@link DialogController} into
 * `$store.dialog` and the `$dialog` magic.
 */

import type { Alpine } from "alpinejs";
import { DialogController } from "./controller";
import type { CreateDialogOptions, DialogAlpine, DialogPluginCallback, DialogStore } from "./types";

/** Key under which the dialog store is registered on `$store`. */
const DIALOG_STORE_KEY = "dialog";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateDialogOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function dialogPlugin(options: CreateDialogOptions = {}): DialogPluginCallback {
  return function registerDialog(alpine: Alpine): void {
    const Alpine = alpine as unknown as DialogAlpine;
    const controller = new DialogController(
      {
        scroll: options.scroll,
        defaultCloseOnEscape: options.closeOnEscape,
        defaultCloseOnOutsideClick: options.closeOnOutsideClick,
        defaultScrollLock: options.scrollLock,
      },
      options.id
    );

    // Build a mutable store object that delegates to the controller.
    // `instances` is a plain object — Alpine's reactive proxy will detect
    // mutations to its nested properties.
    const store: DialogStore = {
      instances: {} as DialogStore["instances"],
      register: (id, opts) => controller.register(id, opts),
      unregister: (id) => controller.unregister(id),
      open: (id, opts) => controller.open(id, opts),
      close: (id) => controller.close(id),
      toggle: (id, opts) => controller.toggle(id, opts),
      isOpen: (id) => controller.isOpen(id),
      bindContainer: (id, container) => controller.bindContainer(id, container),
      handleKeydown: (id, event) => controller.handleKeydown(id, event),
      handleOutsideClick: (id, event) => controller.handleOutsideClick(id, event),
      dialogProps: (id) => controller.dialogProps(id),
      destroy: () => controller.destroy(),
    };

    Alpine.store(DIALOG_STORE_KEY, store);
    const reactiveStore = Alpine.store(DIALOG_STORE_KEY);

    // Override isOpen to read through the reactive proxy so Alpine tracks
    // `instances[id].open` access in templates (x-text, x-show).
    reactiveStore.isOpen = (id: string) => reactiveStore.instances?.[id]?.open ?? false;

    // Sync controller state into the reactive store on every open/close.
    // Alpine's reactive proxy detects mutations to the nested `instances`
    // object, so replacing its properties triggers re-renders.
    const syncInstances = () => {
      const controllerInstances = controller.instances;
      for (const key of Object.keys(controllerInstances)) {
        // Clone each instance so Alpine sees a new object identity on both
        // open and close transitions; the controller mutates instances in place.
        reactiveStore.instances[key] = { ...controllerInstances[key] };
      }
      for (const key of Object.keys(reactiveStore.instances)) {
        if (!(key in controllerInstances)) {
          delete reactiveStore.instances[key];
        }
      }
    };

    controller.on("open", syncInstances);
    controller.on("close", syncInstances);

    Alpine.magic(DIALOG_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed dialog plugin options. */
export function dialogOptions<const T extends CreateDialogOptions>(options: T): T {
  return options;
}

/** @deprecated Use `CreateDialogOptions` instead. */
export type DialogPluginOptions = CreateDialogOptions;
