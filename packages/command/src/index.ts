/**
 * Public entrypoint for `@ailuracode/alpine-command`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createCommandController()` returns a
 *    framework-agnostic controller.
 * 2. Alpine — `commandPlugin()` returns an `Alpine.plugin()` callback
 *    that wires the controller into `$store.command` and `$command`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) -------------------------------------
export { CommandController, createCommandController, createCommandStore } from "./controller";
// --- Event surface -------------------------------------------------------
export type { CommandEvents } from "./events";
// --- Alpine integration --------------------------------------------------
export { commandOptions, commandPlugin, commandPlugin as default } from "./plugin";
// --- Public types ---------------------------------------------------------
export type {
  CommandAction,
  CommandAlpine,
  CommandItem,
  CommandPluginCallback,
  CommandPluginOptions,
  CommandStore,
  CommandStoreConfig,
} from "./types";
