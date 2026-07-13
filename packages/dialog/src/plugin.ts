/**
 * Alpine.js integration for `@ailuracode/alpine-dialog`.
 *
 * Thin adapter that wires {@link DialogController} into
 * `$store.dialog` and the `$dialog` magic.
 */

import { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { DialogController } from "./controller.js";
import { createDialogStoreFromController } from "./store.js";
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

    bridgeControllerStore({
      alpine: Alpine,
      storeKey: DIALOG_STORE_KEY,
      store: createDialogStoreFromController(controller),
      controller,
      subscribe: (reactiveStore) => {
        reactiveStore.isOpen = (id: string) => reactiveStore.instances?.[id]?.open ?? false;
        return controller.on("change", () => {
          syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
        });
      },
    });
  };
}

/** Builds typed dialog plugin options. */
export function dialogOptions<const T extends CreateDialogOptions>(options: T): T {
  return options;
}

/** @deprecated Use `CreateDialogOptions` instead. */
export type DialogPluginOptions = CreateDialogOptions;
