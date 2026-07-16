/**
 * Toast controller — the framework-agnostic core of
 * `@ailuracode/alpine-toast`. Owns every piece of toast queue
 * state and is the single source of truth for the
 * `items` array, the auto-dismiss timers, and the position /
 * variant filtering logic.
 *
 * Responsibilities:
 *
 * 1. **State** — owns `items`, `defaultPosition`, `stackPositions`,
 *    `maxToasts`, `maxVisible`. Mutations always produce a fresh
 *    `items` array (immutable replacement) so Alpine's reactive
 *    proxy can observe the change.
 * 2. **Timers** — schedules auto-dismiss timers per timed toast.
 *    Timers are tracked internally and cleared on `destroy()`
 *    via `registerCleanup()` so the BaseController lifecycle
 *    covers them.
 * 3. **Queue limits** — enforces `maxToasts` per (position, stack)
 *    pair on every `push` / `update` (when position or duration
 *    flips between timed ↔ persistent).
 * 4. **Subscriptions** — typed `on('change', listener)` from the
 *    inherited bus, with the toast-level detail shape (`source`
 *    discriminator + full `items` snapshot).
 *
 * Construction rules:
 *
 * - The constructor MUST NOT touch `window`, `document`, or timers.
 *   Browser-side wiring (the window `toast` event listener) lives
 *   in `mount()`.
 * - The factory `createToastController()` auto-mounts so callers
 *   receive a fully-initialized instance.
 * - `destroy()` MUST be idempotent and MUST clear every pending
 *   timer.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core/controller";
import { createSingleton, releaseSingleton } from "@ailuracode/alpine-core/singleton";
import type { ToastEvents } from "./events";
import type {
  CreateToastControllerOptions,
  ToastChangeDetail,
  ToastChangeSource,
  ToastDuration,
  ToastItem,
  ToastPayload,
  ToastPosition,
  ToastStore,
} from "./types";
import { TOAST_STORE_KEY } from "./types";

export type { CreateToastControllerOptions } from "./types";

/**
 * Default dismiss delay (ms) between marking a toast as `removed`
 * and removing it from the queue. Gives Alpine's `x-transition`
 * time to play the exit animation before the DOM node disappears.
 */
const DISMISS_DELAY_MS = 400;

/**
 * Default `maxToasts` when the option is omitted.
 */
const DEFAULT_MAX_TOASTS = 5;

/**
 * Default `defaultDuration` (ms) when the option is omitted.
 */
const DEFAULT_DURATION_MS = 4000;

/**
 * Stable registry key for the singleton toast controller. The
 * `options.id` is **not** part of the key — `id` identifies the
 * controller instance, but two `createToastController()` calls in
 * the same document describe the same logical toast queue. Tests
 * should call `clearSingleton(TOAST_SINGLETON_KEY)` (or
 * `clearAllSingletons()`) to reset between cases.
 */
const TOAST_SINGLETON_KEY = "@ailuracode/alpine-toast/default";

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link ToastController}. The constructor stays pure; the factory
 * wires the browser-touching `mount()` step.
 *
 * Singleton guarantee: at most one live `ToastController` per
 * document. Repeated calls return the existing instance; the
 * controller's `destroy()` releases the slot so the next call
 * builds a fresh one. Direct `new ToastController(...)` is still
 * supported for tests and advanced consumers — only the
 * `createToastController()` factory enforces uniqueness.
 */
export function createToastController<
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options: CreateToastControllerOptions<TPositions, TContent> = {}
): ToastController<TPositions, TContent> {
  const { scope, ...factoryOptions } = options;
  return createSingleton(
    TOAST_SINGLETON_KEY,
    () => {
      const controller = new ToastController<TPositions, TContent>(factoryOptions);
      controller.mount();
      return controller;
    },
    { scope, options: factoryOptions }
  ) as ToastController<TPositions, TContent>;
}

/**
 * Headless controller for `@ailuracode/alpine-toast`. Owns every
 * piece of toast queue state. The Alpine integration in
 * `plugin.ts` subscribes to the controller's `change` event and
 * mirrors the snapshot into the reactive store so bindings
 * re-render automatically.
 *
 * Standalone consumers (non-Alpine) can `createToastController()`
 * directly and wire their own adapter via
 * `manager.on("change", detail => ...)`.
 */
export class ToastController<
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> extends BaseController<ToastEvents<TPositions, TContent>> {
  readonly #defaultPosition: ToastPosition<TPositions>;
  readonly #stackPositions: readonly ToastPosition<TPositions>[];
  readonly #defaultDuration: number;
  readonly #maxToasts: number;
  readonly #maxVisible: number;
  readonly #storeKey: typeof TOAST_STORE_KEY;
  readonly #listenToWindowEvents: boolean;
  readonly #getStore?: () => ToastStore<readonly [], TPositions, unknown>;

  readonly #dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
  readonly #purgeTimers = new Map<string, ReturnType<typeof setTimeout>>();

  #items: ToastItem<readonly [], TPositions, TContent>[] = [];

  constructor(options: CreateToastControllerOptions<TPositions, TContent>) {
    super(options.id ?? generateId("toast"));

    this.#defaultPosition = (options.defaultPosition ??
      "bottom-right") as ToastPosition<TPositions>;
    this.#stackPositions = resolveStackPositions(this.#defaultPosition, options.positions);
    this.#defaultDuration = options.defaultDuration ?? DEFAULT_DURATION_MS;
    const limits = resolveToastLimits({
      maxToasts: options.maxToasts,
      maxVisible: options.maxVisible,
    });
    this.#maxToasts = limits.maxToasts;
    this.#maxVisible = limits.maxVisible;
    this.#storeKey = options.storeKey ?? TOAST_STORE_KEY;
    this.#listenToWindowEvents = options.listenToWindowEvents !== false;
    this.#getStore = options.getStore;
  }

  /**
   * Tears down every side effect. Idempotent. `super.destroy()` runs
   * the registered cleanups (currently just the window listener)
   * first; the timer cleanup runs as a final step. Also releases
   * the singleton slot so the next `createToastController()` call
   * builds a fresh controller.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    super.destroy();
    this.#clearAllTimers();
    releaseSingleton(TOAST_SINGLETON_KEY, this);
  }

  /**
   * Starts the controller's side effects. The constructor leaves
   * `#items` empty; `mount()` registers the `toast` window event
   * listener (when enabled) and emits the initialization event.
   *
   * Calling `mount()` more than once is a no-op — `BaseController`
   * guards the phase. Calling it after `destroy()` throws.
   */
  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();

    if (this.#listenToWindowEvents && typeof window !== "undefined") {
      const abort = new AbortController();
      const handler = (event: Event) => {
        if (event instanceof CustomEvent) {
          this.fromPayload((event.detail ?? {}) as ToastPayload<readonly [], TPositions, TContent>);
        }
      };
      window.addEventListener("toast", handler, { signal: abort.signal });
      this.registerCleanup(() => abort.abort());
    }

    queueMicrotask(() => {
      if (this.isDestroyed) {
        return;
      }
      this.#emitChange("initialization");
    });
  }

  // ── Public state surface ────────────────────────────────────────

  get defaultPosition(): ToastPosition<TPositions> {
    return this.#defaultPosition;
  }

  get stackPositions(): readonly ToastPosition<TPositions>[] {
    return this.#stackPositions;
  }

  get maxToasts(): number {
    return this.#maxToasts;
  }

  get maxVisible(): number {
    return this.#maxVisible;
  }

  get items(): ToastItem<readonly [], TPositions, TContent>[] {
    return this.#items;
  }

  // ── Public commands ─────────────────────────────────────────────

  push(payload: ToastPayload<readonly [], TPositions, TContent> = {}): string {
    if (this.isDestroyed) {
      return "";
    }

    const position = payload.position ?? this.#defaultPosition;
    const id = generateId("toast");
    const toast: ToastItem<readonly [], TPositions, TContent> = {
      id,
      key: payload.key ?? null,
      content: payload.content ?? null,
      title: payload.title ?? null,
      description: payload.description ?? null,
      variant: payload.variant ?? "default",
      position,
      duration: resolveToastDuration(payload.duration, this.#defaultDuration),
      action: payload.action ?? null,
      removed: false,
    };

    this.#items = [toast, ...this.#items];
    this.#enforcePositionLimit(
      position,
      shouldAutoDismiss(toast.duration) ? "timed" : "persistent"
    );
    this.#scheduleDismiss(id, toast.duration);
    this.#emitChange("push");

    return id;
  }

  pushUnique(key: string, payload: ToastPayload<readonly [], TPositions, TContent> = {}): string {
    if (this.isDestroyed) {
      return "";
    }

    const activeIds = this.#items
      .filter((item) => !item.removed && item.key === key)
      .map((item) => item.id);

    this.#markRemoved(activeIds);
    return this.push({ ...payload, key });
  }

  update(id: string, payload: Partial<ToastPayload<readonly [], TPositions, TContent>> = {}): void {
    if (this.isDestroyed) {
      return;
    }

    const current = this.#items.find((toast) => toast.id === id);
    if (!current) {
      return;
    }

    const previousPosition = current.position;
    const wasPersistent = isPersistentDuration(current.duration);

    this.#items = this.#items.map((item) =>
      item.id === id ? applyToastPatch(item, payload) : item
    );

    const updated = this.#items.find((toast) => toast.id === id);
    if (!updated) {
      return;
    }

    const nextPosition = updated.position;
    const isNowPersistent = isPersistentDuration(updated.duration);
    const durationStackChanged =
      payload.duration !== undefined && wasPersistent !== isNowPersistent;
    const positionChanged = nextPosition !== previousPosition;

    if (positionChanged) {
      this.#enforcePositionLimit(previousPosition, "timed");
      this.#enforcePositionLimit(previousPosition, "persistent");
    }

    if (positionChanged || durationStackChanged) {
      this.#enforcePositionLimit(nextPosition, "timed");
      this.#enforcePositionLimit(nextPosition, "persistent");
    }

    if (payload.duration !== undefined) {
      this.#scheduleDismiss(id, updated.duration);
    }

    this.#emitChange("update");
  }

  dismiss(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    this.#markRemoved([id]);
    this.#emitChange("dismiss");
  }

  dismissAt(position: ToastPosition<TPositions>): void {
    if (this.isDestroyed) {
      return;
    }

    const ids = this.itemsAt(position)
      .filter((item) => !item.removed)
      .map((item) => item.id);

    this.#markRemoved(ids);
    this.#emitChange("dismissAt");
  }

  dismissAll(): void {
    if (this.isDestroyed) {
      return;
    }

    const ids = this.#items.filter((item) => !item.removed).map((item) => item.id);
    this.#markRemoved(ids);
    this.#emitChange("dismissAll");
  }

  // ── Query helpers ───────────────────────────────────────────────

  itemsAt(position: ToastPosition<TPositions>): ToastItem<readonly [], TPositions, TContent>[] {
    return this.#items.filter((item) => item.position === position);
  }

  timedItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<readonly [], TPositions, TContent>[] {
    return this.itemsAt(position).filter((item) => shouldAutoDismiss(item.duration));
  }

  persistentItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<readonly [], TPositions, TContent>[] {
    return this.itemsAt(position).filter((item) => isPersistentDuration(item.duration));
  }

  activeTimedItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<readonly [], TPositions, TContent>[] {
    return this.timedItemsAt(position).filter((item) => !item.removed);
  }

  activePersistentItemsAt(
    position: ToastPosition<TPositions>
  ): ToastItem<readonly [], TPositions, TContent>[] {
    return this.persistentItemsAt(position).filter((item) => !item.removed);
  }

  isVisibleAt(position: ToastPosition<TPositions>, index: number): boolean {
    const stack = this.timedItemsAt(position);
    const item = stack[index];

    if (!item || item.removed) {
      return false;
    }

    if (this.#maxVisible <= 0) {
      return true;
    }

    let rank = 0;
    for (let i = 0; i <= index; i++) {
      if (stack[i] && !stack[i].removed) {
        rank++;
      }
    }

    return rank <= this.#maxVisible;
  }

  /**
   * Public escape hatch for callers (mainly the magic's `fromPayload`)
   * that need to push a toast from a raw `ToastEventPayload` shape.
   */
  fromPayload(payload: ToastPayload<readonly [], TPositions, TContent> = {}): string {
    const { title = null, content = null, variant = "default", ...options } = payload;
    return this.push({
      title,
      content,
      variant,
      ...options,
    });
  }

  // ── Internals ───────────────────────────────────────────────────

  #emitChange(source: ToastChangeSource): void {
    if (this.isDestroyed) {
      return;
    }
    const detail: ToastChangeDetail<readonly [], TPositions, TContent> = {
      source,
      items: this.#items,
    };
    this.emit("change", detail);
  }

  /**
   * Marks the given ids as `removed`. Schedules a purge timer so
   * they drop out of the queue after `DISMISS_DELAY_MS`. Does NOT
   * emit — the caller (push / update / dismiss / dismissAt /
   * dismissAll / pushUnique) emits once after the mutation
   * completes to avoid event storms on bulk dismisses.
   */
  #markRemoved(ids: string[]): void {
    if (ids.length === 0) {
      return;
    }

    const idsToRemove: string[] = [];

    for (const id of ids) {
      const toast = this.#items.find((item) => item.id === id);
      if (!toast || toast.removed) {
        continue;
      }
      this.#clearDismissTimer(id);
      idsToRemove.push(id);
    }

    if (idsToRemove.length === 0) {
      return;
    }

    const removeSet = new Set(idsToRemove);

    this.#items = this.#items.map((item) =>
      removeSet.has(item.id) ? { ...item, removed: true } : item
    );

    const batchId = generateId("toast-purge");
    const timer = setTimeout(() => {
      this.#purgeTimers.delete(batchId);
      if (this.isDestroyed) {
        return;
      }
      this.#items = this.#items.filter((item) => !removeSet.has(item.id));
      this.#emitChange("dismiss");
    }, DISMISS_DELAY_MS);
    this.#purgeTimers.set(batchId, timer);
  }

  /**
   * Trims the active timed or persistent stack at `position` so it
   * doesn't exceed `maxToasts`. Overflow items are marked as
   * `removed` (with the standard delay before purge) — no exception
   * is thrown.
   */
  #enforcePositionLimit(position: ToastPosition<TPositions>, stack: "timed" | "persistent"): void {
    if (this.#maxToasts <= 0) {
      return;
    }

    const itemsAtPosition = this.itemsAt(position);
    const stackItems =
      stack === "persistent"
        ? itemsAtPosition.filter((item) => isPersistentDuration(item.duration))
        : itemsAtPosition.filter((item) => shouldAutoDismiss(item.duration));
    const activeAtPosition = stackItems.filter((item) => !item.removed);
    const overflowIds = activeAtPosition.slice(this.#maxToasts).map((item) => item.id);

    this.#markRemoved(overflowIds);
  }

  #scheduleDismiss(id: string, duration: ToastDuration): void {
    this.#clearDismissTimer(id);

    // Promise loading uses a sentinel duration — settled via `update`, not a timer.
    if (duration === PROMISE_LOADING_DURATION) {
      return;
    }

    if (shouldAutoDismiss(duration)) {
      const timer = setTimeout(() => {
        this.#dismissTimers.delete(id);
        if (this.isDestroyed) {
          return;
        }
        // Route through `getStore()` when provided so callers can
        // observe timer-fired dismissals through a wrapper (e.g. an
        // Alpine reactive proxy). Falls back to the controller's
        // own dismiss when no accessor is set.
        const target = this.#getStore?.() ?? null;
        if (target) {
          target.dismiss(id);
        } else {
          this.dismiss(id);
        }
      }, duration);
      this.#dismissTimers.set(id, timer);
    }
  }

  #clearDismissTimer(id: string): void {
    const timer = this.#dismissTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.#dismissTimers.delete(id);
    }
  }

  #clearAllTimers(): void {
    for (const timer of this.#dismissTimers.values()) {
      clearTimeout(timer);
    }
    this.#dismissTimers.clear();

    for (const timer of this.#purgeTimers.values()) {
      clearTimeout(timer);
    }
    this.#purgeTimers.clear();
  }
}

// ── Standalone store wrapper ─────────────────────────────────────────────

/**
 * Wraps a {@link ToastController} in the {@link ToastStore} surface.
 * The store's reads delegate to the controller; mutations go
 * through the controller's semantic commands.
 *
 * The wrapper subscribes to the controller's `change` event so its
 * own `items` property stays in sync with the controller's queue —
 * that subscription is what keeps standalone consumers (`store.items`
 * reads in tests, scripts) up to date. Alpine consumers also benefit
 * because the wrapper's `items` is a regular settable property,
 * which means Alpine's reactive proxy can intercept assignments
 * through its SET trap and trigger template re-renders.
 *
 * The Alpine adapter (`plugin.ts`) registers its own subscription
 * that mirrors changes into the proxy via the SET trap — that is
 * what triggers Alpine's reactivity. The wrapper's own subscription
 * keeps `store.items` fresh in standalone use and provides a
 * redundant but safe update path in Alpine use (Alpine's SET trap
 * still fires because the proxy's cached value lags the target's
 * direct mutation).
 *
 * `destroy()` unsubscribes the internal listener AND forwards to
 * the controller's destroy so callers have one entry point.
 *
 * Used both by `toastPlugin` (to register with Alpine) and by the
 * standalone {@link createToastStore} factory.
 */
export function wrapToastStore<
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  controller: ToastController<TPositions, TContent>
): ToastStore<readonly [], TPositions, TContent> {
  const store: ToastStore<readonly [], TPositions, TContent> = {
    defaultPosition: controller.defaultPosition,
    stackPositions: controller.stackPositions,
    maxToasts: controller.maxToasts,
    maxVisible: controller.maxVisible,
    items: [...controller.items],
    push(payload) {
      return controller.push(payload);
    },
    pushUnique(key, payload) {
      return controller.pushUnique(key, payload ?? {});
    },
    update(id, payload) {
      controller.update(id, payload);
    },
    dismiss(id) {
      controller.dismiss(id);
    },
    dismissAt(position) {
      controller.dismissAt(position);
    },
    dismissAll() {
      controller.dismissAll();
    },
    destroy() {
      unsubscribe();
      controller.destroy();
    },
    itemsAt(position) {
      return this.items.filter((item) => item.position === position);
    },
    timedItemsAt(position) {
      return this.itemsAt(position).filter((item) => shouldAutoDismiss(item.duration));
    },
    persistentItemsAt(position) {
      return this.itemsAt(position).filter((item) => isPersistentDuration(item.duration));
    },
    activeTimedItemsAt(position) {
      return this.timedItemsAt(position).filter((item) => !item.removed);
    },
    activePersistentItemsAt(position) {
      return this.persistentItemsAt(position).filter((item) => !item.removed);
    },
    isVisibleAt(position, index) {
      const stack = this.timedItemsAt(position);
      const item = stack[index];

      if (!item || item.removed) {
        return false;
      }

      if (this.maxVisible <= 0) {
        return true;
      }

      let rank = 0;
      for (let i = 0; i <= index; i++) {
        if (stack[i] && !stack[i].removed) {
          rank++;
        }
      }

      return rank <= this.maxVisible;
    },
  };

  // Internal subscription keeps `store.items` aligned with the
  // controller's queue. Alpine's reactive proxy fires its SET trap
  // separately when the plugin mirrors through it.
  const unsubscribe = controller.on("change", (detail) => {
    store.items = [...detail.items];
  });

  return store;
}

/**
 * Standalone factory — creates a fresh (non-singleton)
 * {@link ToastController} and returns the {@link ToastStore}
 * surface. Useful for tests, scripts, and non-Alpine consumers
 * that need a one-off queue.
 *
 * Each call returns a NEW controller; for the document-level
 * singleton pattern, use {@link createToastController} instead.
 */
export function createToastStore<
  const TPositions extends readonly string[] = readonly [],
  TContent = unknown,
>(
  options: CreateToastControllerOptions<TPositions, TContent> = {}
): ToastStore<readonly [], TPositions, TContent> {
  const controller = new ToastController<TPositions, TContent>(options);
  controller.mount();
  return wrapToastStore(controller);
}

// ── Pure helpers (re-exported from the public surface) ──────────────────

/**
 * Timed duration for `$toast.promise` loading state.
 * Stays in the timed stack; the timer is replaced when the promise
 * settles. Exported from `./index.ts` so consumers can compare
 * against the sentinel without importing the controller module.
 */
export const PROMISE_LOADING_DURATION = 3_600_000;

/** Canonical persistent value — `0` is normalized to `false`. */
export function normalizeToastDuration(duration: ToastDuration): ToastDuration {
  if (duration === 0) {
    return false;
  }
  return duration;
}

/** Resolves payload duration — `false` / `0` persist; `undefined` uses the default. */
export function resolveToastDuration(
  duration: ToastDuration | undefined,
  defaultDuration: number
): ToastDuration {
  if (duration === undefined) {
    return normalizeToastDuration(defaultDuration);
  }
  return normalizeToastDuration(duration);
}

/** Whether the toast should schedule an auto-dismiss timer. */
export function shouldAutoDismiss(duration: ToastDuration): duration is number {
  return typeof duration === "number" && duration > 0 && Number.isFinite(duration);
}

/** Persistent toasts (`duration: false` / `0`) use a separate UI stack from timed toasts. */
export function isPersistentDuration(duration: ToastDuration): boolean {
  return !shouldAutoDismiss(duration);
}

/** Resolves `maxToasts` / `maxVisible` with the standard clamp rule. */
export function resolveToastLimits(options: { maxToasts?: number; maxVisible?: number } = {}): {
  maxToasts: number;
  maxVisible: number;
} {
  const maxToasts = options.maxToasts ?? DEFAULT_MAX_TOASTS;
  let maxVisible = options.maxVisible ?? maxToasts;

  if (maxToasts > 0 && maxVisible > maxToasts) {
    maxVisible = maxToasts;
  }

  return { maxToasts, maxVisible };
}

/** Unique stack keys: built-in default plus configured positions. */
export function resolveStackPositions<TPositions extends readonly string[]>(
  defaultPosition: ToastPosition<TPositions>,
  positions?: TPositions
): readonly ToastPosition<TPositions>[] {
  const stacks: ToastPosition<TPositions>[] = [defaultPosition];

  for (const position of positions ?? []) {
    if (!stacks.includes(position as ToastPosition<TPositions>)) {
      stacks.push(position as ToastPosition<TPositions>);
    }
  }

  return stacks;
}

/**
 * Pure patch helper — returns a new toast with the given payload
 * keys merged in. `duration` flows through `normalizeToastDuration`
 * so `0` collapses to `false`. Other `undefined` values are ignored
 * (the original key is preserved).
 *
 * Explicit per-field branches instead of `Object.entries(payload)`
 * + dynamic `Object.assign` because the union type of
 * `Partial<ToastPayload>` is too wide for `Object.assign`'s
 * inference to land cleanly — splitting fields gives us a single
 * deterministic path per key without casts.
 */
function applyToastPatch<TPositions extends readonly string[], TContent = unknown>(
  item: ToastItem<readonly [], TPositions, TContent>,
  payload: Partial<ToastPayload<readonly [], TPositions, TContent>>
): ToastItem<readonly [], TPositions, TContent> {
  let next: ToastItem<readonly [], TPositions, TContent> = { ...item };

  if (payload.content !== undefined) {
    next = { ...next, content: payload.content };
  }
  if (payload.title !== undefined) {
    next = { ...next, title: payload.title };
  }
  if (payload.description !== undefined) {
    next = { ...next, description: payload.description };
  }
  if (payload.variant !== undefined) {
    next = { ...next, variant: payload.variant };
  }
  if (payload.position !== undefined) {
    next = { ...next, position: payload.position };
  }
  if (payload.duration !== undefined) {
    next = { ...next, duration: normalizeToastDuration(payload.duration) };
  }
  if (payload.action !== undefined) {
    next = { ...next, action: payload.action };
  }
  if (payload.key !== undefined) {
    next = { ...next, key: payload.key };
  }

  return next;
}
