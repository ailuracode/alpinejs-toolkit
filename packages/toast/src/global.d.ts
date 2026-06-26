/// <reference types="@types/alpinejs" />

export declare const TOAST_STORE_KEY: "toast";

export type DefaultToastPosition = "bottom-right";

export type ToastPosition<TPositions extends readonly string[] = readonly []> =
  | DefaultToastPosition
  | TPositions[number];

export type DefaultToastVariant = "default";

export type ToastVariant<TVariants extends readonly string[] = readonly []> =
  | DefaultToastVariant
  | TVariants[number];

export interface ToastAction {
  label: string;
  onClick?: () => void;
}

export interface ToastPayload<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> {
  content?: TContent | null;
  title?: string | null;
  description?: string | null;
  variant?: ToastVariant<TVariants>;
  position?: ToastPosition<TPositions>;
  duration?: number;
  action?: ToastAction | null;
}

export interface ToastItem<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> {
  id: string;
  content: TContent | null;
  title: string | null;
  description: string | null;
  variant: ToastVariant<TVariants>;
  position: ToastPosition<TPositions>;
  duration: number;
  action: ToastAction | null;
  removed: boolean;
}

export type ToastPayloadWithoutVariant<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> = Omit<ToastPayload<TVariants, TPositions, TContent>, "variant">;

export interface ToastPromiseOptions<TVariants extends readonly string[] = readonly []> {
  loading?: string;
  error?: string;
  duration?: number;
  loadingVariant?: ToastVariant<TVariants>;
  successVariant?: ToastVariant<TVariants>;
  errorVariant?: ToastVariant<TVariants>;
}

export interface ToastPluginOptions<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  _TContent = unknown,
> {
  variants?: TVariants;
  positions?: TPositions;
  defaultPosition?: ToastPosition<TPositions>;
  defaultDuration?: number;
  promise?: ToastPromiseOptions<TVariants>;
  maxToasts?: number;
  maxVisible?: number;
  listenToWindowEvents?: boolean;
  storeKey?: string;
}

export interface ToastPromiseMessages<
  T = unknown,
  TVariant extends string = string,
  TContent = unknown,
> {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string;
  loadingContent?: TContent;
  successContent?: TContent | ((data: T) => TContent);
  errorContent?: TContent;
  loadingVariant?: TVariant;
  successVariant?: TVariant;
  errorVariant?: TVariant;
  duration?: number;
}

export type ToastPromiseInput<T> = (() => Promise<T> | T) | Promise<T>;

export type ToastEventPayload<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> = ToastPayload<TVariants, TPositions, TContent>;

export interface ToastStore<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> {
  defaultPosition: ToastPosition<TPositions>;
  stackPositions: readonly ToastPosition<TPositions>[];
  maxToasts: number;
  maxVisible: number;
  items: ToastItem<TVariants, TPositions, TContent>[];
  push(payload?: ToastPayload<TVariants, TPositions, TContent>): string;
  update(id: string, payload?: Partial<ToastPayload<TVariants, TPositions, TContent>>): void;
  dismiss(id: string): void;
  dismissAt(position: ToastPosition<TPositions>): void;
  dismissAll(): void;
  itemsAt(position: ToastPosition<TPositions>): ToastItem<TVariants, TPositions, TContent>[];
  isVisibleAt(position: ToastPosition<TPositions>, index: number): boolean;
}

export type ToastVariantMethods<
  TVariants extends readonly string[],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> = {
  [K in TVariants[number]]: (
    titleOrPayload: string | ToastPayloadWithoutVariant<TVariants, TPositions, TContent>,
    options?: Omit<ToastPayloadWithoutVariant<TVariants, TPositions, TContent>, "title" | "content">
  ) => string;
};

export type ToastMagic<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> = {
  (title: string, options?: Omit<ToastPayload<TVariants, TPositions, TContent>, "title">): string;
  (payload: ToastPayload<TVariants, TPositions, TContent>): string;
  promise<T>(
    factoryOrPromise: ToastPromiseInput<T>,
    messages?: ToastPromiseMessages<T, ToastVariant<TVariants>, TContent>
  ): Promise<T>;
  dismiss(id: string): void;
  update(id: string, payload?: Partial<ToastPayload<TVariants, TPositions, TContent>>): void;
  dismissAt(position: ToastPosition<TPositions>): void;
  dismissAll(): void;
  fromPayload(payload?: ToastEventPayload<TVariants, TPositions, TContent>): string;
} & ToastVariantMethods<TVariants, TPositions, TContent>;

export type ResolvedPromiseConfig<TVariants extends readonly string[] = readonly []> = {
  loading: string;
  error: string;
  duration: number;
  loadingVariant: ToastVariant<TVariants>;
  successVariant: ToastVariant<TVariants>;
  errorVariant: ToastVariant<TVariants>;
};

export type ResolvedToastPluginConfig<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
> = {
  defaultPosition: ToastPosition<TPositions>;
  defaultDuration: number;
  maxToasts: number;
  maxVisible: number;
  listenToWindowEvents: boolean;
  storeKey: string;
  variants: TVariants;
  positions: TPositions;
  promise: ResolvedPromiseConfig<TVariants>;
};

export declare function resolveToastPluginConfig<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
>(
  options?: ToastPluginOptions<TVariants, TPositions>
): ResolvedToastPluginConfig<TVariants, TPositions>;

export declare function toastOptions<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options: ToastPluginOptions<TVariants, TPositions, TContent>
): ToastPluginOptions<TVariants, TPositions, TContent>;

export declare function toastVariants<const T extends readonly string[]>(variants: T): T;

export declare function toastPositions<const T extends readonly string[]>(positions: T): T;

export interface CreateToastStoreOptions<TPositions extends readonly string[] = readonly []> {
  defaultPosition?: ToastPosition<TPositions>;
  positions?: TPositions;
  defaultDuration?: number;
  maxToasts?: number;
  maxVisible?: number;
}

export declare function resolveStackPositions<TPositions extends readonly string[]>(
  defaultPosition: ToastPosition<TPositions>,
  positions?: TPositions
): readonly ToastPosition<TPositions>[];

export declare function createToastStore<
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(options?: CreateToastStoreOptions<TPositions>): ToastStore<readonly [], TPositions, TContent>;

export declare function createToastMagic<
  const TVariants extends readonly string[],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  config: ResolvedToastPluginConfig<TVariants, TPositions>,
  getStore: () => ToastStore<TVariants, TPositions, TContent>
): ToastMagic<TVariants, TPositions, TContent>;

declare function toastPlugin<
  const TVariants extends readonly string[] = readonly [],
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options?: ToastPluginOptions<TVariants, TPositions, TContent>
): (Alpine: import("alpinejs").Alpine) => void;
declare function toastPlugin(Alpine: import("alpinejs").Alpine): void;

export default toastPlugin;

declare global {
  namespace Alpine {
    interface Magics<T> {
      $toast: ToastMagic;
    }
  }
}
