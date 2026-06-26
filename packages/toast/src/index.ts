import type AlpineType from "alpinejs";
import { resolveToastPluginConfig } from "./config.js";
import { createToastMagic } from "./magic.js";
import { createToastStore } from "./store.js";
import type { ToastEventPayload, ToastPluginOptions, ToastStore } from "./types.js";

export {
  resolveToastPluginConfig,
  toastOptions,
  toastPositions,
  toastVariants,
} from "./config.js";
export { createToastMagic, RESERVED_TOAST_MAGIC_KEYS } from "./magic.js";
export { createToastStore, resolveStackPositions, resolveToastLimits } from "./store.js";
export type {
  DefaultToastPosition,
  DefaultToastVariant,
  ResolvedPromiseConfig,
  ResolvedToastPluginConfig,
  ToastAction,
  ToastEventPayload,
  ToastItem,
  ToastMagic,
  ToastPayload,
  ToastPayloadWithoutVariant,
  ToastPluginOptions,
  ToastPosition,
  ToastPromiseInput,
  ToastPromiseMessages,
  ToastPromiseOptions,
  ToastStore,
  ToastVariant,
  ToastVariantMethods,
} from "./types.js";

/** Internal Alpine store key used by the toast plugin. */
export const TOAST_STORE_KEY = "toast";

function registerToastPlugin<
  TVariants extends readonly string[],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  Alpine: AlpineType.Alpine,
  options: ToastPluginOptions<TVariants, TPositions, TContent> = {} as ToastPluginOptions<
    TVariants,
    TPositions,
    TContent
  >
): void {
  const config = resolveToastPluginConfig(options);
  const store = createToastStore<TPositions, TContent>({
    defaultPosition: config.defaultPosition,
    positions: config.positions,
    defaultDuration: config.defaultDuration,
    maxToasts: config.maxToasts,
    maxVisible: config.maxVisible,
  });

  Alpine.store(config.storeKey, store);
  const toast = createToastMagic(
    config,
    () => Alpine.store(config.storeKey) as ToastStore<TVariants, TPositions, TContent>
  );
  Alpine.magic("toast", () => toast);

  if (config.listenToWindowEvents && typeof window !== "undefined") {
    window.addEventListener("toast", (event) => {
      if (event instanceof CustomEvent) {
        toast.fromPayload(
          (event.detail ?? {}) as ToastEventPayload<TVariants, TPositions, TContent>
        );
      }
    });
  }
}

/** Alpine.js toast plugin. Registers magic `$toast` with an internal reactive queue. CSS-framework agnostic — no markup or styles. */
export default function toastPlugin<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  optionsOrAlpine?: ToastPluginOptions<TVariants, TPositions, TContent> | AlpineType.Alpine
): undefined | ((Alpine: AlpineType.Alpine) => void) {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    registerToastPlugin(optionsOrAlpine as AlpineType.Alpine, {});
    return;
  }

  const options =
    (optionsOrAlpine as ToastPluginOptions<TVariants, TPositions, TContent> | undefined) ?? {};

  return (Alpine: AlpineType.Alpine) => {
    registerToastPlugin(Alpine, options);
  };
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $toast: import("./types.js").ToastMagic;
    }
  }
}
