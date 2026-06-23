export type {
  MutationStateHandle,
  QueryStateAdapter,
  QueryStateHandle,
} from "./adapters/types.js";
export { vanillaQueryAdapter } from "./adapters/vanilla.js";
export {
  bridgeMutationHandleToAlpine,
  bridgeQueryHandleToAlpine,
  createAlpineBridgedAdapter,
} from "./alpine-bridge.js";
export { createQueryClient, createQueryStore } from "./client.js";
export type {
  MutationDevtoolsEntry,
  QueryDevtoolsApi,
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
} from "./devtools.js";
export {
  createQueryPlugin,
  default,
  default as query,
  type QueryAdapterFactory,
  type QueryRegisterOptions,
} from "./plugin.js";
export {
  attachMutationFlags,
  attachQueryFlags,
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateRecord,
} from "./state/view.js";
export type {
  FetchStatus,
  MutationOptions,
  MutationState,
  MutationStatus,
  QueryClientOptions,
  QueryKey,
  QueryOptions,
  QueryPluginOptions,
  QueryState,
  QueryStore,
} from "./types.js";

export { hashKey, matchesQueryKey } from "./utils.js";
