/**
 * Alpine.js integration for `@ailuracode/alpine-dialog`.
 *
 * Thin adapter that wires {@link DialogController} into
 * `$store.dialog` and the `$dialog` magic.
 */

import type { Alpine } from "alpinejs";
import { DialogController } from "./controller.js";
import { createDialogStoreFromController, syncInstanceRegistry } from "./store.js";
import type { CreateDialogOptions, DialogAlpine, DialogPluginCallback } from "./types.js";

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

    const store = createDialogStoreFromController(controller);
    Alpine.store(DIALOG_STORE_KEY, store);
    const reactiveStore = Alpine.store(DIALOG_STORE_KEY);

    const syncReactiveInstances = () => {
      syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
    };

    controller.on("change", syncReactiveInstances);

    reactiveStore.isOpen = (id: string) => reactiveStore.instances?.[id]?.open ?? false;

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
