/**
 * Overlay controller — the headless domain logic for the
 * `@ailuracode/alpine-overlay` package.
 *
 * Extends `BaseController<OverlayEvents>` from
 * `@ailuracode/alpine-core`. The base class supplies:
 * - Stable `id` (`generateId("controller")`)
 * - `mount()` / `destroy()` lifecycle + phase tracking
 * - `on / once / off / emit` typed event surface
 * - `registerCleanup()` for resource handles
 * - `ToolkitError('CONTROLLER_DESTROYED')` on misuse
 *
 * Overlay-specific concerns added on top:
 * - The slot allocator (delegated to {@link createSlotState})
 * - The portal root reference (resolved lazily via
 *   {@link resolveOrCreatePortalRoot})
 * - Idempotent `register` / `unregister` against the slot map
 *
 * The singleton instance is registered via `createSingleton` from
 * core (replaces the previous inlined `Map`-based registry).
 */

import { BaseController, createSingleton, releaseSingleton } from "@ailuracode/alpine-core";
import { OverlayError } from "./error.js";
import type { OverlayEvents } from "./events.js";
import { resolveOrCreatePortalRoot, safeDocument } from "./internal/portal.js";
import { createSlotState, nextSlot, releaseSlot, type SlotState } from "./internal/z-index.js";
import { normalizeOverlayOptions } from "./options.js";
import type {
  OverlayChangeDetail,
  OverlayChangeListener,
  OverlayOptions,
  OverlayState,
} from "./types.js";

/** Singleton key used by {@link createOverlay}. Mirrors scroll / sidebar / theme. */
export const OVERLAY_SINGLETON_KEY = "@ailuracode/alpine-overlay/default";

/**
 * Headless overlay controller. Private state is held via `#field`
 * syntax; the public surface is getters + imperative methods.
 */
export class OverlayController extends BaseController<OverlayEvents> {
  #state: OverlayState | null = null;
  readonly #slots: SlotState;
  #root: HTMLElement | null = null;
  #configured = false;

  constructor(options?: OverlayOptions) {
    super();
    // Eagerly normalize so a controller that is created without
    // configure() still has sensible defaults — `register()` will
    // lazily allocate slots even before `configure()` runs.
    const normalized = normalizeOverlayOptions(options);
    this.#slots = createSlotState(normalized.baseZIndex, normalized.step);
    if (options !== undefined) {
      this.configure(options);
    }
  }

  /** Snapshot of the current state, or `null` when destroyed. */
  get state(): OverlayState {
    if (this.isDestroyed) {
      throw new OverlayError(
        `Overlay controller "${this.id}" was destroyed.`,
        "OVERLAY_NOT_CONFIGURED"
      );
    }
    if (this.#state) {
      return this.#state;
    }
    return {
      root: this.#root,
      stack: [],
      count: 0,
      baseZIndex: this.#slots.baseZIndex,
      step: this.#slots.step,
    };
  }

  /** Idempotent. Second call with the same options is a no-op. */
  configure(options: OverlayOptions): void {
    if (this.isDestroyed) {
      return;
    }
    const normalized = normalizeOverlayOptions(options);
    const stackIsEmpty = this.#slots.stack.length === 0;

    if (!stackIsEmpty) {
      // Re-configuration with a non-empty stack would invalidate
      // the visible z-indices. Reject the call rather than mutate
      // mid-flight — the consumer can `destroy()` and recreate if
      // they really need new defaults.
      const currentBase = this.#slots.baseZIndex;
      const currentStep = this.#slots.step;
      if (currentBase !== normalized.baseZIndex || currentStep !== normalized.step) {
        throw new OverlayError(
          `Cannot re-configure overlay baseZIndex (${currentBase} -> ${normalized.baseZIndex}) or step (${currentStep} -> ${normalized.step}) while the stack is non-empty. Destroy and recreate the controller to change scale.`,
          "INVALID_OPTIONS"
        );
      }
      return;
    }

    // Stack is empty — first-time configure (or re-configure with
    // empty stack). Apply options in place.
    (this.#slots as { baseZIndex: number; step: number }).baseZIndex = normalized.baseZIndex;
    (this.#slots as { baseZIndex: number; step: number }).step = normalized.step;

    this.#root = resolveOrCreatePortalRoot(normalized.root, safeDocument());
    this.#configured = true;
  }

  /**
   * Idempotent. Allocates a slot for `(plugin, id)` and returns the
   * z-index. When the pair is already registered, the existing
   * z-index is returned and no `change` event fires.
   */
  register(plugin: string, id: string): number {
    if (this.isDestroyed) {
      throw new OverlayError(
        `Cannot register on destroyed overlay controller.`,
        "OVERLAY_NOT_CONFIGURED"
      );
    }
    assertNonEmptyPluginId(plugin, id);

    if (!this.#configured) {
      this.configure({});
    }

    const { entry, isNew } = nextSlot(this.#slots, plugin, id);
    if (isNew) {
      this.#emit({
        action: "register",
        stack: [...this.#slots.stack],
        added: entry,
      });
    }
    return entry.zIndex;
  }

  /** Silent no-op when the pair is unknown. */
  unregister(plugin: string, id: string): void {
    if (this.isDestroyed) {
      return;
    }
    assertNonEmptyPluginId(plugin, id);

    const removed = releaseSlot(this.#slots, plugin, id);
    if (!removed) {
      return;
    }
    this.#emit({
      action: "unregister",
      stack: [...this.#slots.stack],
      removed,
    });
  }

  /**
   * Returns the z-index for `(plugin, id)`. Auto-registers the
   * slot if it doesn't exist yet — this makes `zIndexOf` safe to
   * use directly in `:style` bindings without an explicit
   * `register()` call. Pair with `unregister()` when the
   * consumer closes the corresponding overlay.
   *
   * Returns `0` when the controller has been destroyed (e.g. SSR).
   */
  zIndexOf(plugin: string, id: string): number {
    if (this.isDestroyed) {
      return 0;
    }
    const key = slotKeyOf(plugin, id);
    const existing = this.#slots.slots.get(key);
    if (existing !== undefined) {
      return existing;
    }
    return this.register(plugin, id);
  }

  isOpen(plugin: string, id: string): boolean {
    if (this.isDestroyed) {
      return false;
    }
    return this.#slots.slots.has(slotKeyOf(plugin, id));
  }

  /** Idempotent. No-op when the controller has not been mounted. */
  override mount(): void {
    if (this.isDestroyed) {
      // BaseController already throws ToolkitError('CONTROLLER_DESTROYED')
      // for the same case — let it propagate.
      super.mount();
      return;
    }
    super.mount();
    if (!this.#configured) {
      this.configure({});
    }
  }

  /** Idempotent. Clears the stack, removes listeners (inherited). */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#slots.slots.clear();
    this.#slots.stack.length = 0;
    this.#state = null;
    this.#root = null;
    super.destroy();
    releaseSingleton(OVERLAY_SINGLETON_KEY, this);
  }

  #emit(detail: OverlayChangeDetail): void {
    this.#state = {
      root: this.#root,
      stack: detail.stack,
      count: detail.stack.length,
      baseZIndex: this.#slots.baseZIndex,
      step: this.#slots.step,
    };
    // `emit` is `protected` on BaseController — using the typed
    // narrow here keeps the call site typed without exposing emit
    // on the public surface.
    this.emit("change", detail);
  }
}

function assertNonEmptyPluginId(plugin: string, id: string): void {
  if (typeof plugin !== "string" || plugin.length === 0) {
    throw new OverlayError(
      `Overlay register/unregister requires a non-empty plugin name. Got ${JSON.stringify(plugin)}.`,
      "INVALID_PLUGIN_ID"
    );
  }
  if (typeof id !== "string" || id.length === 0) {
    throw new OverlayError(
      `Overlay register/unregister requires a non-empty id. Got ${JSON.stringify(id)}.`,
      "INVALID_PLUGIN_ID"
    );
  }
}

function slotKeyOf(plugin: string, id: string): string {
  return `${plugin}::${id}`;
}

/**
 * Returns the singleton controller, building + mounting one on the
 * first call. Mirrors the singleton pattern used by `theme`,
 * `lang`, `sidebar`, `media`, and `scroll` v1.0.0.
 */
export function createOverlay(options: OverlayOptions = {}): OverlayController {
  const { scope, ...factoryOptions } = options;
  return createSingleton(
    OVERLAY_SINGLETON_KEY,
    () => {
      const controller = new OverlayController(factoryOptions);
      controller.mount();
      return controller;
    },
    { scope }
  );
}

/** Type-narrowed `on` that exposes only the overlay event surface. */
export type OverlayControllerOn = OverlayController["on"];
export type _OverlayChangeListener = OverlayChangeListener;
