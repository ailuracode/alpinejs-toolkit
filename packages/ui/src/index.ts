/**
 * Public entrypoint for `@ailuracode/alpine-ui`.
 *
 * The `ui` package is a framework-agnostic infrastructure layer
 * used primarily by Alpine Toolkit packages. It exposes only
 * currently shipped primitives that downstream packages would
 * otherwise re-implement in lock-step.
 *
 * Exports are grouped by domain:
 *
 * 1. **Storage adapters** — generic factories for `localStorage`
 *    and in-memory backends. Each returns a
 *    {@link StorageAdapter} value-polymorphic in `Value`.
 * 2. **Media query helpers** — SSR-safe `matchMedia` subscription.
 * 3. **Portal root** — generic DOM primitive for materialising a
 *    portal container under SSR-safe contracts.
 * 4. **Types** — the {@link StorageAdapter} contract plus
 *    {@link PortalRootOptions} option shape.
 */

// --- Media query helpers -----------------------------------------------
export { createMediaQueryListener } from "./media/match-media.js";
export type { PortalRootOptions } from "./portal/index.js";
// --- Portal helpers ----------------------------------------------------
export { createPortalRoot } from "./portal/index.js";
// --- Storage adapters --------------------------------------------------
export {
  createLocalStorageAdapter,
  createMemoryAdapter,
} from "./storage/index.js";
// --- Public types -------------------------------------------------------
export type {
  LocalStorageAdapterOptions,
  MemoryAdapterOptions,
  StorageAdapter,
  SubscribableStorageAdapter,
  Unsubscribe,
} from "./types.js";
