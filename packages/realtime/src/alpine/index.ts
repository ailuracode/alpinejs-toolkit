/**
 * Public Alpine integration surface for `@ailuracode/alpine-realtime`.
 *
 * The plugin factory itself lives in `../plugin/realtimePlugin`
 * and is re-exported from the main entrypoint so consumers can
 * write `import realtime from "@ailuracode/alpine-realtime"`.
 *
 * This barrel only exposes the **typed surface** (`RealtimeStore`,
 * `RealtimeMagic`, `RealtimeAlpine`, the store/magic key
 * constants, and the pure factory helpers). Consumers reach it
 * through the dedicated `./alpine` subpath
 * (`@ailuracode/alpine-realtime/alpine`).
 *
 * Note: `src/index.ts` does NOT re-export from `./alpine/` —
 * architecture-check forbids re-exports of an `alpine/` subpath
 * from a public barrel. Consumers reach the plugin through the
 * package's main entrypoint and reach the types through the
 * `./alpine` subpath.
 */

export type {
  RealtimeAlpine,
  RealtimeMagic,
  RealtimePluginCallback,
  RealtimeStore,
  SseTransportAdapterOptions,
  WsTransportAdapterOptions,
} from "../plugin/realtimePlugin";
export {
  createRealtimeMagic,
  createRealtimeStore,
  REALTIME_MAGIC_KEY,
  REALTIME_STORE_KEY,
  resolveAdapter,
} from "../plugin/realtimePlugin";
