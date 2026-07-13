/**
 * Alpine.js integration for `@ailuracode/alpine-toast`.
 *
 * Thin adapter that wires {@link ToastController} into `$store.toast`
 * and the `$toast` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import {
  type CreateToastControllerOptions,
  createToastController,
  PROMISE_LOADING_DURATION,
  type ToastController,
  wrapToastStore,
} from "./controller";
import type {
  ResolvedPromiseConfig,
  ResolvedToastPluginConfig,
  ToastAlpine,
  ToastChangeDetail,
  ToastDuration,
  ToastEventPayload,
  ToastMagic,
  ToastPayload,
  ToastPayloadWithoutVariant,
  ToastPluginCallback,
  ToastPluginOptions,
  ToastPromiseInput,
  ToastPromiseMessages,
  ToastStore,
  ToastVariant,
} from "./types";
import { TOAST_STORE_KEY } from "./types";

/**
 * Default plugin options — applies when the consumer omits a key.
 * Kept in sync with the original `config.ts` defaults so existing
 * consumers see no behavioral drift.
 */
const DEFAULT_PLUGIN_OPTIONS = {
  defaultPosition: "bottom-right",
  defaultDuration: 4000,
  maxToasts: 5,
  listenToWindowEvents: true,
} as const;

/** Variant names that cannot override core `$toast` methods. */
export const RESERVED_TOAST_MAGIC_KEYS = new Set([
  "dismiss",
  "update",
  "dismissAt",
  "dismissAll",
  "pushUnique",
  "fromPayload",
  "promise",
]);

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
    storeKey: options.storeKey ?? TOAST_STORE_KEY,
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

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link ToastPluginOptions} to configure {@link ToastController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function toastPlugin<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options: ToastPluginOptions<TVariants, TPositions, TContent> = {} as ToastPluginOptions<
    TVariants,
    TPositions,
    TContent
  >
): ToastPluginCallback {
  return function registerToast(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `ToastAlpine`.
    const Alpine = alpine as unknown as ToastAlpine;
    const controllerOptions: CreateToastControllerOptions<TPositions, TContent> = {
      defaultPosition: options.defaultPosition,
      positions: options.positions,
      defaultDuration: options.defaultDuration,
      maxToasts: options.maxToasts,
      maxVisible: options.maxVisible,
      listenToWindowEvents: options.listenToWindowEvents,
      storeKey: options.storeKey,
    };

    // `createToastController()` already mounts; the controller's
    // constructor stays pure (no `window` / `document` access).
    const controller = createToastController<TPositions, TContent>(controllerOptions);
    const config = resolveToastPluginConfig(options);
    const store = wrapToastStore<TPositions, TContent>(controller);

    const { reactiveStore } = bindControllerStore({
      alpine: Alpine,
      storeKey: config.storeKey,
      store: store as unknown as ToastStore,
      controller,
      sync: (proxy, detail) => {
        const change = detail as ToastChangeDetail<readonly [], TPositions, TContent>;
        const mutable = proxy as unknown as ToastStore<readonly [], TPositions, TContent>;
        mutable.items = [...change.items];
      },
      magic: false,
    });

    const toast = createToastMagic<TVariants, TPositions, TContent>(
      config,
      () => reactiveStore as unknown as ToastStore<TVariants, TPositions, TContent>
    );
    Alpine.magic("toast", () => toast);
  };
}

/**
 * Wraps a {@link ToastController} in the {@link ToastStore} surface
 * that Alpine consumers (templates, `$store.toast.*` references)
 * see. The store's reads delegate to the controller; mutations go
 * through the controller's semantic commands.
 *
 * The store is intentionally a thin object literal — every field is
 * a direct getter into the controller, and every method is a one-line
 * delegation. Splitting helpers would add indirection without buying
 * anything because the controller already exposes the entire surface.
 *
 * The implementation lives in `./controller.ts` (see
 * {@link wrapToastStore}) so both `toastPlugin` and the standalone
 * `createToastStore` factory can share it.
 */

// ── Magic construction (kept standalone for non-Alpine use) ─────────────

/**
 * Builds the callable `$toast` magic API. The magic delegates every
 * command to the store accessor passed in by the caller — typically
 * `() => Alpine.store("toast")` so the magic stays reactive, but
 * tests inject their own store.
 */
export function createToastMagic<
  const TVariants extends readonly string[],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  config: ResolvedToastPluginConfig<TVariants, TPositions>,
  getStore: () => ToastStore<TVariants, TPositions, TContent>
): ToastMagic<TVariants, TPositions, TContent> {
  const magic = ((
    titleOrPayload: string | ToastPayload<TVariants, TPositions, TContent>,
    options?: Omit<ToastPayload<TVariants, TPositions, TContent>, "title">
  ) => pushToast(getStore(), titleOrPayload, options ?? {})) as ToastMagic<
    TVariants,
    TPositions,
    TContent
  >;

  magic.dismiss = (id) => getStore().dismiss(id);
  magic.update = (id, payload) => getStore().update(id, payload);
  magic.dismissAt = (position) => getStore().dismissAt(position);
  magic.dismissAll = () => getStore().dismissAll();
  magic.pushUnique = (key, payload) => getStore().pushUnique(key, payload ?? {});

  magic.fromPayload = (payload: ToastEventPayload<TVariants, TPositions, TContent> = {}) => {
    const { title = null, content = null, variant = "default", ...options } = payload;

    return pushToast(getStore(), {
      title,
      content,
      variant,
      ...options,
    });
  };

  magic.promise = async <T>(
    factoryOrPromise: ToastPromiseInput<T>,
    messages: ToastPromiseMessages<T, ToastVariant<TVariants>, TContent> = {}
  ): Promise<T> => {
    const promiseConfig = config.promise;
    const loadingVariant = messages.loadingVariant ?? promiseConfig.loadingVariant;
    const successVariant = messages.successVariant ?? promiseConfig.successVariant;
    const errorVariant = messages.errorVariant ?? promiseConfig.errorVariant;
    const settledDuration = messages.duration ?? promiseConfig.duration;

    const id = getStore().push({
      title: messages.loading ?? promiseConfig.loading,
      content: messages.loadingContent ?? null,
      variant: loadingVariant,
      duration: PROMISE_LOADING_DURATION,
    } as ToastPayload<TVariants, TPositions, TContent>);

    try {
      const data = await resolveToastPromise(factoryOrPromise);

      getStore().update(
        id,
        buildPromiseSuccessPatch(data, messages, successVariant, settledDuration)
      );

      return data;
    } catch (error) {
      getStore().update(
        id,
        buildPromiseErrorPatch(messages, promiseConfig, errorVariant, settledDuration)
      );

      throw error;
    }
  };

  for (const variant of config.variants) {
    if (RESERVED_TOAST_MAGIC_KEYS.has(variant)) {
      continue;
    }

    Object.assign(magic, {
      [variant]: (
        titleOrPayload: string | ToastPayloadWithoutVariant<TVariants, TPositions, TContent>,
        options: Omit<
          ToastPayloadWithoutVariant<TVariants, TPositions, TContent>,
          "title" | "content"
        > = {}
      ) =>
        pushVariantToast(getStore(), variant as ToastVariant<TVariants>, titleOrPayload, options),
    });
  }

  return magic;
}

function pushToast<
  TVariants extends readonly string[],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  store: ToastStore<TVariants, TPositions, TContent>,
  titleOrPayload: string | ToastPayload<TVariants, TPositions, TContent>,
  options: Omit<ToastPayload<TVariants, TPositions, TContent>, "title"> = {}
): string {
  if (typeof titleOrPayload === "string") {
    return store.push({
      title: titleOrPayload,
      ...options,
    });
  }

  return store.push(titleOrPayload);
}

function pushVariantToast<
  TVariants extends readonly string[],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  store: ToastStore<TVariants, TPositions, TContent>,
  variant: ToastVariant<TVariants>,
  titleOrPayload: string | ToastPayloadWithoutVariant<TVariants, TPositions, TContent>,
  options: Omit<
    ToastPayloadWithoutVariant<TVariants, TPositions, TContent>,
    "title" | "content"
  > = {}
): string {
  if (typeof titleOrPayload === "string") {
    return store.push({
      title: titleOrPayload,
      ...options,
      variant,
    });
  }

  return store.push({
    ...titleOrPayload,
    ...options,
    variant,
  });
}

function resolveSuccessTitle<T>(data: T, messages: ToastPromiseMessages<T>): string | undefined {
  if (typeof messages.success === "function") {
    return messages.success(data);
  }

  return messages.success;
}

function resolveSuccessContent<T, TContent>(
  data: T,
  messages: ToastPromiseMessages<T, string, TContent>
): TContent | undefined {
  const { successContent } = messages;

  if (typeof successContent === "function") {
    return (successContent as (value: T) => TContent)(data);
  }

  return successContent;
}

function resolveErrorTitle<T, V extends string = string>(
  messages: ToastPromiseMessages<T, V>,
  fallbackError: string
): string {
  return messages.error ?? fallbackError;
}

function resolveToastPromise<T>(factoryOrPromise: ToastPromiseInput<T>): Promise<T> {
  if (typeof factoryOrPromise === "function") {
    return Promise.resolve(factoryOrPromise());
  }

  return Promise.resolve(factoryOrPromise);
}

function buildPromiseSuccessPatch<T, TContent, TVariants extends readonly string[]>(
  data: T,
  messages: ToastPromiseMessages<T, ToastVariant<TVariants>, TContent>,
  successVariant: ToastVariant<TVariants>,
  settledDuration: ToastDuration
): Partial<ToastPayload<TVariants, readonly [], TContent>> {
  const successTitle = resolveSuccessTitle(data, messages);
  const successContent = resolveSuccessContent(data, messages);

  return {
    ...(successTitle !== undefined ? { title: successTitle } : {}),
    ...(successContent !== undefined ? { content: successContent } : {}),
    variant: successVariant,
    duration: settledDuration,
  };
}

function buildPromiseErrorPatch<T, TContent, TVariants extends readonly string[]>(
  messages: ToastPromiseMessages<T, ToastVariant<TVariants>, TContent>,
  promiseConfig: ResolvedPromiseConfig<TVariants>,
  errorVariant: ToastVariant<TVariants>,
  settledDuration: ToastDuration
): Partial<ToastPayload<TVariants, readonly [], TContent>> {
  return {
    title: resolveErrorTitle(messages, promiseConfig.error),
    ...(messages.errorContent !== undefined ? { content: messages.errorContent } : {}),
    variant: errorVariant,
    duration: settledDuration,
  };
}
