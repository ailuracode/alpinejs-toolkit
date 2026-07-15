/**
 * Public entrypoint for `@ailuracode/alpine-toast`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file
 * MUST only contain re-exports. The framework-agnostic controller
 * lives in `./controller.ts`, the Alpine integration in
 * `./plugin.ts`, the event map in `./events.ts`, and the public
 * types / constants in `./types.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Alpine — `Alpine.plugin(toastPlugin({ ... }))` registers the
 *    `$store.toast` store and the `$toast` magic.
 * 2. Standalone — `createToastStore({ ... })` returns a queue for
 *    custom adapters / tests / non-Alpine apps. For the
 *    document-level singleton, use `createToastController({ ... })`.
 *
 * Exports are grouped by domain so consumers can scan the surface in
 * one pass: public factory → controller → Alpine adapter → plugin
 * options helpers → pure helpers → constants → event surface →
 * public types.
 */

// --- Headless controller --------------------------------------------------
export {
  type CreateToastControllerOptions,
  createToastController,
  createToastStore,
  isPersistentDuration,
  normalizeToastDuration,
  PROMISE_LOADING_DURATION,
  resolveStackPositions,
  resolveToastDuration,
  resolveToastLimits,
  shouldAutoDismiss,
  ToastController,
  wrapToastStore,
} from "./controller";
// --- Event surface -------------------------------------------------------
export type { ToastEvents, ToastListener } from "./events";
// --- Alpine integration --------------------------------------------------
export {
  createToastMagic,
  RESERVED_TOAST_MAGIC_KEYS,
  resolveToastPluginConfig,
  toastOptions,
  toastPlugin as default,
  toastPlugin,
  toastPositions,
  toastVariants,
} from "./plugin";
// --- Public types --------------------------------------------------------
export type {
  CreateToastStoreOptions,
  DefaultToastPosition,
  DefaultToastVariant,
  ResolvedPromiseConfig,
  ResolvedToastPluginConfig,
  ToastAction,
  ToastAlpine,
  ToastChangeDetail,
  ToastChangeSource,
  ToastDuration,
  ToastEventPayload,
  ToastItem,
  ToastMagic,
  ToastMagicKey,
  ToastManager,
  ToastPayload,
  ToastPayloadWithoutVariant,
  ToastPluginCallback,
  ToastPluginOptions,
  ToastPosition,
  ToastPromiseInput,
  ToastPromiseMessages,
  ToastPromiseOptions,
  ToastStore,
  ToastStoreKey,
  ToastVariant,
  ToastVariantMethods,
  Unsubscribe,
} from "./types";
// --- Public constants ----------------------------------------------------
export { TOAST_MAGIC_KEY, TOAST_STORE_KEY } from "./types";
