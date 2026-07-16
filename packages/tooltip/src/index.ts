/**
 * Public entrypoint for `@ailuracode/alpine-tooltip`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core/types";
// --- Controller (framework-agnostic) -------------------------------------
export { createTooltipController, TooltipController } from "./controller";
// --- Event surface -------------------------------------------------------
export type { TooltipEvents } from "./events";
// --- Alpine integration --------------------------------------------------
export { tooltipOptions, tooltipPlugin, tooltipPlugin as default } from "./plugin";
// --- Store factory -------------------------------------------------------
export { createTooltipStore, createTooltipStoreFromController } from "./store";
// --- Public types ---------------------------------------------------------
export type {
  CreateTooltipOptions,
  TooltipAlpine,
  TooltipChangeDetail,
  TooltipChangeSource,
  TooltipInstance,
  TooltipInstanceOptions,
  TooltipPluginCallback,
  TooltipStore,
} from "./types";
// --- Public constants ----------------------------------------------------
export { DEFAULT_TOOLTIP_STORE_KEY } from "./types";
