/**
 * Public entrypoint for `@ailuracode/alpine-command`.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export { createCommandAlpineStore, syncCommandStore } from "./alpine/store.js";
export {
  CommandController,
  createCommandController,
  createCommandStore,
} from "./controller.js";
export type { CommandErrorCode } from "./errors.js";
export { CommandError } from "./errors.js";
export type { CommandEvents } from "./events.js";
export { normalizeCommandOptions, ROOT_PAGE_ID } from "./options.js";
export {
  commandOptions,
  commandPlugin,
  commandPlugin as default,
  createCommandStoreFromController,
} from "./plugin.js";
export type {
  CommandAction,
  CommandAlpine,
  CommandExecutionState,
  CommandFilterFn,
  CommandItem,
  CommandItemState,
  CommandLoader,
  CommandPage,
  CommandPersistence,
  CommandPluginCallback,
  CommandPluginOptions,
  CommandPredicate,
  CommandRankFn,
  CommandSearchStrategy,
  CommandStore,
  CommandStoreConfig,
  NormalizedCommandOptions,
} from "./types.js";
