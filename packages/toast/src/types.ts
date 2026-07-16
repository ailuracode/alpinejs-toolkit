/**
 * Public type contracts for `@ailuracode/alpine-toast`.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — changes to a field name
 * or type are breaking changes.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core/controller";
import type { SingletonScope } from "@ailuracode/alpine-core/singleton";
import type { Alpine, PluginCallback } from "@ailuracode/alpine-core/types";
import type { Alpine as AlpineBase } from "alpinejs";

// --- Shared re-exports ----------------------------------------------------
export type { Unsubscribe };

/** Built-in Alpine store key for the toast queue. */
export const TOAST_STORE_KEY = "toast" as const;

/** Built-in `$toast` magic key registered by {@link toastPlugin}. */
export const TOAST_MAGIC_KEY = "toast" as const;

export type ToastStoreKey = typeof TOAST_STORE_KEY;
export type ToastMagicKey = typeof TOAST_MAGIC_KEY;

/** Built-in position used when none is provided. Map to CSS in your UI layer. */
export type DefaultToastPosition = "bottom-right";

/** Union of `bottom-right` plus developer-defined positions from plugin options. */
export type ToastPosition<TPositions extends readonly string[] = readonly []> =
  | DefaultToastPosition
  | TPositions[number];

/** Built-in variant used when none is provided. */
export type DefaultToastVariant = "default";

/** Milliseconds before auto-dismiss, or `false` / `0` to keep the toast open. */
export type ToastDuration = number | false;

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
  duration?: ToastDuration;
  action?: ToastAction | null;
  /**
   * Optional dedupe key — use with `pushUnique` so only one active toast keeps this key.
   * Useful for undo flows and single-slot notices.
   */
  key?: string | null;
}

export interface ToastItem<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> {
  id: string;
  key: string | null;
  content: TContent | null;
  title: string | null;
  description: string | null;
  variant: ToastVariant<TVariants>;
  position: ToastPosition<TPositions>;
  duration: ToastDuration;
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
  duration?: ToastDuration;
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
  storeKey?: ToastStoreKey;
  /**
   * `$toast` magic key the Alpine plugin registers under. Defaults to
   * {@link TOAST_MAGIC_KEY}. Set when the host already owns a `toast`
   * magic or another toolkit plugin would collide on that name — the
   * rename avoids the collision without touching the controller.
   * Ignored by the standalone `createToastController` helper.
   */
  magicKey?: string;
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
  duration?: ToastDuration;
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
  /** Dismiss active toasts with the same `key`, then push. */
  pushUnique(key: string, payload?: ToastPayload<TVariants, TPositions, TContent>): string;
  update(id: string, payload?: Partial<ToastPayload<TVariants, TPositions, TContent>>): void;
  dismiss(id: string): void;
  /** Dismiss every toast in a position stack. */
  dismissAt(position: ToastPosition<TPositions>): void;
  /** Dismiss all toasts in every stack. */
  dismissAll(): void;
  /** Clear pending timers — call when tearing down the plugin or store. */
  destroy(): void;
  /** Toasts at `position`, newest first (includes exiting `removed` items). */
  itemsAt(position: ToastPosition<TPositions>): ToastItem<TVariants, TPositions, TContent>[];
  /** Timed stack at `position` (includes exiting `removed` items). */
  timedItemsAt(position: ToastPosition<TPositions>): ToastItem<TVariants, TPositions, TContent>[];
  /** Persistent stack at `position` (includes exiting `removed` items). */
  persistentItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<TVariants, TPositions, TContent>[];
  /** Active timed toasts only — preferred for `x-for` render lists. */
  activeTimedItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<TVariants, TPositions, TContent>[];
  /** Active persistent toasts only — preferred for `x-for` render lists. */
  activePersistentItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<TVariants, TPositions, TContent>[];
  /** Whether the timed toast at `index` (within `timedItemsAt`) should render. */
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
  /** Push after dismissing any active toast with the same `key`. */
  pushUnique(key: string, payload?: ToastPayload<TVariants, TPositions, TContent>): string;
  fromPayload(payload?: ToastEventPayload<TVariants, TPositions, TContent>): string;
} & ToastVariantMethods<TVariants, TPositions, TContent>;

export type ResolvedPromiseConfig<TVariants extends readonly string[] = readonly []> = {
  loading: string;
  error: string;
  duration: ToastDuration;
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
  storeKey: ToastStoreKey;
  magicKey: string;
  variants: TVariants;
  positions: TPositions;
  promise: ResolvedPromiseConfig<TVariants>;
};

// --- Controller surface (NEW: headless controller architecture) ----------

/**
 * Source of a toast transition — informs subscribers why a change
 * happened. Single source of truth for the `change` event's `source`
 * field; adding a new member ripples through every consumer so
 * exhaustiveness is enforced by TypeScript.
 *
 * Public: branching on `detail.source` is a contract.
 */
export type ToastChangeSource =
  | "initialization"
  | "push"
  | "pushUnique"
  | "update"
  | "dismiss"
  | "dismissAt"
  | "dismissAll";

/**
 * Structured payload delivered to subscribers on every transition.
 *
 * - `source` discriminates the kind of transition.
 * - `items` is the full snapshot — Alpine's reactive proxy mirrors
 *   the array reference (replacing, not mutating in place) so
 *   template `x-for` loops see the new contents.
 */
export interface ToastChangeDetail<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> {
  readonly source: ToastChangeSource;
  readonly items: ToastItem<TVariants, TPositions, TContent>[];
}

/** Options accepted by {@link createToastController}. */
export interface CreateToastControllerOptions<
  TPositions extends readonly string[] = readonly [],
  _TContent = unknown,
> {
  /**
   * Stable identifier exposed via {@link ToastController.id}. When
   * omitted, the controller generates one from the controller name.
   * Tests typically pin this for deterministic assertions.
   */
  readonly id?: string;
  /** Default position for new toasts when payload omits it. */
  readonly defaultPosition?: ToastPosition<TPositions>;
  /** Declared positions — each gets its own stack. */
  readonly positions?: TPositions;
  /** Default auto-dismiss duration in milliseconds. */
  readonly defaultDuration?: number;
  /** Maximum toasts in the queue. `0` = unlimited. */
  readonly maxToasts?: number;
  /** Maximum toasts shown at once. Defaults to `maxToasts`. */
  readonly maxVisible?: number;
  /** Listen for `toast` window events. Default: `true`. */
  readonly listenToWindowEvents?: boolean;
  /** Internal store key. Default: `"toast"`. */
  readonly storeKey?: ToastStoreKey;
  /**
   * Reactive store accessor — maintained for backwards compatibility
   * with the pre-controller architecture. The auto-dismiss timer
   * routes through this accessor when provided, so callers can wrap
   * the store in a proxy and observe timer-fired dismissals.
   */
  readonly getStore?: () => ToastStore<readonly [], TPositions, unknown>;
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly via
   * `createSingletonScope()`.
   */
  readonly scope?: SingletonScope;
}

/**
 * Public, framework-agnostic manager returned by {@link createToastController}.
 *
 * Reads flow through getters; mutations go through the manager so
 * subscriptions and the in-place snapshot stay consistent.
 *
 * The Alpine integration subscribes to the `change` event and
 * mirrors the snapshot into the reactive store so bindings re-render
 * automatically. Standalone consumers can wire their own adapter via
 * `manager.on("change", detail => ...)`.
 */
export interface ToastManager<
  TVariants extends readonly string[] = readonly [],
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> {
  /** Default position for new toasts when payload omits it. */
  readonly defaultPosition: ToastPosition<TPositions>;
  /** Declared positions with an independent stack each. */
  readonly stackPositions: readonly ToastPosition<TPositions>[];
  /** Maximum toasts in the queue. `0` = unlimited. */
  readonly maxToasts: number;
  /** Maximum toasts shown at once. */
  readonly maxVisible: number;
  /** Live snapshot of every toast (newest first). */
  readonly items: ToastItem<TVariants, TPositions, TContent>[];
  /** Pushes a new toast and returns its id. */
  push(payload?: ToastPayload<TVariants, TPositions, TContent>): string;
  /**
   * Dismisses every active toast with the same `key`, then pushes.
   * Useful for undo flows and single-slot notices.
   */
  pushUnique(key: string, payload?: ToastPayload<TVariants, TPositions, TContent>): string;
  /** Patches a toast in place by id. Resets the auto-dismiss timer if `duration` changes. */
  update(id: string, payload?: Partial<ToastPayload<TVariants, TPositions, TContent>>): void;
  /** Marks a toast as removed; purge happens after a short delay. */
  dismiss(id: string): void;
  /** Marks every toast at `position` as removed. */
  dismissAt(position: ToastPosition<TPositions>): void;
  /** Marks every toast as removed. */
  dismissAll(): void;
  /** Toasts at `position`, newest first (includes exiting `removed` items). */
  itemsAt(position: ToastPosition<TPositions>): ToastItem<TVariants, TPositions, TContent>[];
  /** Timed stack at `position` (includes exiting `removed` items). */
  timedItemsAt(position: ToastPosition<TPositions>): ToastItem<TVariants, TPositions, TContent>[];
  /** Persistent stack at `position` (includes exiting `removed` items). */
  persistentItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<TVariants, TPositions, TContent>[];
  /** Active timed toasts only — preferred for `x-for` render lists. */
  activeTimedItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<TVariants, TPositions, TContent>[];
  /** Active persistent toasts only — preferred for `x-for` render lists. */
  activePersistentItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<TVariants, TPositions, TContent>[];
  /** Whether the timed toast at `index` (within `timedItemsAt`) should render. */
  isVisibleAt(position: ToastPosition<TPositions>, index: number): boolean;
  /**
   * Subscribes to a `change` event. Returns an unsubscribe function.
   * The detail payload carries `source` and `items` (full snapshot).
   */
  on(
    event: "change",
    listener: (detail: ToastChangeDetail<TVariants, TPositions, TContent>) => void
  ): Unsubscribe;
  /** Tears down listeners and timers. Idempotent. */
  destroy(): void;
}

/**
 * Typed view of `Alpine` the toast plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with the `toast`
 * store mapped to its concrete {@link ToastStore} shape. A real
 * `Alpine` runtime is assignable to `ToastAlpine` without a cast
 * because the toolkit's `Alpine<Stores>` only adds overloads.
 *
 * The optional `cleanup?` member mirrors theme/lang/scroll's
 * integrations so `controller.destroy()` can be forwarded through
 * Alpine's lifecycle when available.
 */
export type ToastAlpine = Alpine<{ toast: ToastStore }> & {
  /** Forwarded through Alpine's cleanup mechanism when available. */
  cleanup?(callback: () => void): void;
};

/**
 * `Alpine.plugin()` callback signature.
 *
 * Typed against the base {@link AlpineBase} via the toolkit's
 * {@link PluginCallback} generic, which keeps this alias structurally
 * assignable to `Base.PluginCallback`. The plugin narrows the
 * runtime instance to {@link ToastAlpine} inside the function body
 * for typed access to the `"toast"` store / magic.
 */
export type ToastPluginCallback = PluginCallback<AlpineBase>;

// --- Backwards-compat helper aliases --------------------------------------

/** Backwards-compat alias for {@link CreateToastControllerOptions}. */
export interface CreateToastStoreOptions<TPositions extends readonly string[] = readonly []> {
  defaultPosition?: ToastPosition<TPositions>;
  /** Declared positions — each gets its own stack. */
  positions?: TPositions;
  defaultDuration?: number;
  maxToasts?: number;
  maxVisible?: number;
  /** Reactive store accessor — required for Alpine auto-dismiss timers. */
  getStore?: () => ToastStore<readonly [], TPositions, unknown>;
}
