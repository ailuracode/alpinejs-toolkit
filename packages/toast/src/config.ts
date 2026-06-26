import type {
  ResolvedPromiseConfig,
  ResolvedToastPluginConfig,
  ToastPluginOptions,
  ToastVariant,
} from "./types.js";

const DEFAULT_PLUGIN_OPTIONS = {
  defaultPosition: "bottom-right",
  defaultDuration: 4000,
  maxToasts: 5,
  listenToWindowEvents: true,
} as const;

function variantFromList<TVariants extends readonly string[]>(
  variants: TVariants,
  preferred: string
): ToastVariant<TVariants> {
  if (variants.includes(preferred)) {
    return preferred as ToastVariant<TVariants>;
  }

  return "default";
}

function resolvePromiseConfig<TVariants extends readonly string[]>(
  variants: TVariants,
  promise: ToastPluginOptions<TVariants>["promise"] = {}
): ResolvedPromiseConfig<TVariants> {
  return {
    loading: promise.loading ?? "Loading...",
    error: promise.error ?? "Error",
    duration: promise.duration ?? 4000,
    loadingVariant: promise.loadingVariant ?? variantFromList(variants, "loading"),
    successVariant: promise.successVariant ?? variantFromList(variants, "success"),
    errorVariant: promise.errorVariant ?? variantFromList(variants, "error"),
  };
}

/** Resolves plugin options with defaults and queue limit rules. */
export function resolveToastPluginConfig<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
>(
  options: ToastPluginOptions<TVariants, TPositions> = {} as ToastPluginOptions<
    TVariants,
    TPositions
  >
): ResolvedToastPluginConfig<TVariants, TPositions> {
  const variants = (options.variants ?? []) as TVariants;
  const positions = (options.positions ?? []) as TPositions;
  const maxToasts = options.maxToasts ?? DEFAULT_PLUGIN_OPTIONS.maxToasts;
  let maxVisible = options.maxVisible ?? maxToasts;

  if (maxToasts > 0 && maxVisible > maxToasts) {
    maxVisible = maxToasts;
  }

  return {
    defaultPosition: options.defaultPosition ?? DEFAULT_PLUGIN_OPTIONS.defaultPosition,
    defaultDuration: options.defaultDuration ?? DEFAULT_PLUGIN_OPTIONS.defaultDuration,
    maxToasts,
    maxVisible,
    listenToWindowEvents:
      options.listenToWindowEvents ?? DEFAULT_PLUGIN_OPTIONS.listenToWindowEvents,
    storeKey: options.storeKey ?? "toast",
    variants,
    positions,
    promise: resolvePromiseConfig(variants, options.promise),
  };
}

/** Builds typed toast plugin options with inferred variant and position literals. */
export function toastOptions<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options: ToastPluginOptions<TVariants, TPositions, TContent>
): ToastPluginOptions<TVariants, TPositions, TContent> {
  return options;
}

/** Declares toast variant names with full literal inference. */
export function toastVariants<const T extends readonly string[]>(variants: T): T {
  return variants;
}

/** Declares toast position names with full literal inference. */
export function toastPositions<const T extends readonly string[]>(positions: T): T {
  return positions;
}
