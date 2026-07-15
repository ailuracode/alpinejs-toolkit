/**
 * Public entrypoint for `@ailuracode/alpine-accordion`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createAccordionController()` returns a
 *    framework-agnostic controller.
 * 2. Alpine — `accordionPlugin()` returns an `Alpine.plugin()` callback
 *    that wires the controller into `$store.accordion` and `$accordion`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) -------------------------------------
export { AccordionController, createAccordionController } from "./controller";
// --- Event surface -------------------------------------------------------
export type { AccordionEvents } from "./events";
// --- Alpine integration --------------------------------------------------
export { accordionOptions, accordionPlugin, accordionPlugin as default } from "./plugin";
// --- Store factory -------------------------------------------------------
export { createAccordionStore, createAccordionStoreFromController } from "./store";
// --- Public types ---------------------------------------------------------
export type {
  AccordionAlpine,
  AccordionChangeDetail,
  AccordionChangeSource,
  AccordionGroup,
  AccordionGroupOptions,
  AccordionItem,
  AccordionMode,
  AccordionPluginCallback,
  AccordionStore,
  CreateAccordionOptions,
} from "./types";
// --- Public constants ------------------------------------------------
export {
  DEFAULT_ACCORDION_MAGIC_KEY,
  DEFAULT_ACCORDION_STORE_KEY,
} from "./types";
