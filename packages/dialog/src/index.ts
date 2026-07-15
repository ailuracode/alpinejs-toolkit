/**
 * Public entrypoint for `@ailuracode/alpine-dialog`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createDialogController()` returns a
 *    framework-agnostic controller.
 * 2. Alpine — `dialogPlugin()` returns an `Alpine.plugin()` callback
 *    that wires the controller into `$store.dialog` and `$dialog`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) -------------------------------------
export { createDialogController, DialogController } from "./controller";
// --- Event surface -------------------------------------------------------
export type { DialogEvents } from "./events";
// --- Focus utilities (internal, re-exported for advanced use) ------------
export { createFocusTrap, getFocusableElements, restoreFocus } from "./focus.js";
// --- Alpine integration --------------------------------------------------
export {
  type DialogPluginOptions,
  dialogOptions,
  dialogPlugin,
  dialogPlugin as default,
} from "./plugin";
// --- Store factory -------------------------------------------------------
export { createDialogStore, createDialogStoreFromController } from "./store";
// --- Public types ---------------------------------------------------------
export type {
  CreateDialogOptions,
  DialogAlpine,
  DialogChangeDetail,
  DialogChangeSource,
  DialogCloseDetail,
  DialogInstance,
  DialogInstanceOptions,
  DialogOpenDetail,
  DialogOpenOptions,
  DialogPluginCallback,
  DialogStore,
  DialogStoreConfig,
} from "./types";
// --- Public constants ----------------------------------------------------
export { DEFAULT_DIALOG_STORE_KEY } from "./types";
