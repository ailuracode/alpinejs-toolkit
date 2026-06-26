/** Built-in position used when none is provided. Map to CSS in your UI layer. */
export type DefaultToastPosition = "bottom-right";

/** Union of `bottom-right` plus developer-defined positions from plugin options. */
export type ToastPosition<TPositions extends readonly string[] = readonly []> =
  | DefaultToastPosition
  | TPositions[number];

/** Built-in variant used when none is provided. */
export type DefaultToastVariant = "default";

/** Union of `default` plus developer-defined variants from plugin options. */
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
  /** Arbitrary payload for your renderer — objects, arrays, DOM refs, etc. */
  content?: TContent | null;
  /** Optional string shorthand; omit when using `content` only. */
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
  /** Loading toast title. Default: `"Loading..."`. */
  loading?: string;
  /** Error toast title. Default: `"Error"`. */
  error?: string;
  /** Auto-dismiss duration after success/error. Default: `4000`. */
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
  /** Optional variant names — each registers a `$toast.<variant>()` shortcut. */
  variants?: TVariants;
  /** Optional position names — stored on each toast; style via your own CSS. */
  positions?: TPositions;
  /** Default toast position when omitted from a payload. */
  defaultPosition?: ToastPosition<TPositions>;
  /** Default auto-dismiss duration in milliseconds. */
  defaultDuration?: number;
  /** Promise flow defaults (`loading` → `success` / `error` variants and copy). */
  promise?: ToastPromiseOptions<TVariants>;
  /** Maximum toasts in the queue. `0` = unlimited. Default: `5`. */
  maxToasts?: number;
  /** Maximum toasts shown at once. Defaults to `maxToasts`. */
  maxVisible?: number;
  /** Listen for `toast` window events. Default: `true`. */
  listenToWindowEvents?: boolean;
  /** Internal store key. Default: `"toast"`. */
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

/** Async factory or an existing `Promise` / thenable passed to `$toast.promise`. */
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
  /** Positions with an independent toast stack each. */
  stackPositions: readonly ToastPosition<TPositions>[];
  maxToasts: number;
  maxVisible: number;
  items: ToastItem<TVariants, TPositions, TContent>[];
  push(payload?: ToastPayload<TVariants, TPositions, TContent>): string;
  update(id: string, payload?: Partial<ToastPayload<TVariants, TPositions, TContent>>): void;
  dismiss(id: string): void;
  /** Dismiss every toast in a position stack. */
  dismissAt(position: ToastPosition<TPositions>): void;
  /** Dismiss all toasts in every stack. */
  dismissAll(): void;
  /** Toasts at `position`, newest first. */
  itemsAt(position: ToastPosition<TPositions>): ToastItem<TVariants, TPositions, TContent>[];
  /** Whether the toast at `index` within a position stack should render. */
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
  /** Dismiss every toast in a position stack. */
  dismissAt(position: ToastPosition<TPositions>): void;
  /** Dismiss all toasts in every stack. */
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
