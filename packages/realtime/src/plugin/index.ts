/**
 * Public plugin entrypoint for `@ailuracode/alpine-realtime`.
 *
 * The plugin factory itself is re-exported from the main
 * entrypoint (`./index.ts`) so consumers can write
 * `import realtime from "@ailuracode/alpine-realtime"`. This
 * barrel also re-exports the typed plugin surface
 * (`RealtimePluginCallback`, `RealtimeAlpine`) for advanced
 * consumers that prefer importing from a subpath.
 */

export type {
  RealtimeAlpine,
  RealtimeMagic,
  RealtimePluginCallback,
  RealtimeStore,
} from "./realtimePlugin";
export {
  createRealtimeMagic,
  createRealtimeStore,
  default,
  REALTIME_MAGIC_KEY,
  REALTIME_STORE_KEY,
  realtimePlugin,
  resolveAdapter,
} from "./realtimePlugin";
