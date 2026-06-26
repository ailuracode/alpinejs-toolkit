import type {
  ResolvedToastPluginConfig,
  ToastEventPayload,
  ToastMagic,
  ToastPayload,
  ToastPayloadWithoutVariant,
  ToastPromiseInput,
  ToastPromiseMessages,
  ToastStore,
  ToastVariant,
} from "./types.js";

/** Variant names that cannot override core `$toast` methods. */
export const RESERVED_TOAST_MAGIC_KEYS = new Set([
  "dismiss",
  "update",
  "dismissAt",
  "dismissAll",
  "fromPayload",
  "promise",
]);

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
  settledDuration: number
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
  promiseConfig: ResolvedToastPluginConfig<TVariants>["promise"],
  errorVariant: ToastVariant<TVariants>,
  settledDuration: number
): Partial<ToastPayload<TVariants, readonly [], TContent>> {
  return {
    title: resolveErrorTitle(messages, promiseConfig.error),
    ...(messages.errorContent !== undefined ? { content: messages.errorContent } : {}),
    variant: errorVariant,
    duration: settledDuration,
  };
}

/** Builds the callable `$toast` magic API backed by the internal toast store. */
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
      duration: 0,
    });

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
