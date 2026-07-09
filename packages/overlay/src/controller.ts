/**
 * Overlay controller — the headless domain logic for the
 * `@ailuracode/alpine-overlay` package.
 *
 * The controller owns:
 * - The slot allocator (delegated to {@link createSlotState}).
 * - The portal root reference.
 * - The listener registry for `change` events.
 *
 * It exposes:
 * - `configure({ root, baseZIndex, step })` — idempotent.
 * - `register(plugin, id)` / `unregister(plugin, id)`.
 * - `zIndexOf(plugin, id)` / `isOpen(plugin, id)`.
 * - `state` (readonly snapshot for templates).
 * - `on('change', listener)` (inherited from the EventEmitter
 *   implementation embedded below — kept inline because master
 *   core does not yet export `BaseController`).
 *
 * Construction is side-effect free — no DOM access, no listener
 * registration. `mount()` is a no-op kept for symmetry with the
 * future headless-controller split. `destroy()` clears the stack
 * and removes every listener (idempotent).
 */

import { OverlayError } from "./error.js";
import type { OverlayEvents } from "./events.js";
import { resolveOrCreatePortalRoot, safeDocument } from "./internal/portal.js";
import {
  createSlotState,
  nextSlot,
  releaseSlot,
  type SlotState,
} from "./internal/z-index.js";
import { normalizeOverlayOptions } from "./options.js";
import type {
  OverlayChangeDetail,
  OverlayChangeListener,
  OverlayOptions,
  OverlayState,
} from "./types.js";

/** Singleton key used by {@link createOverlay}. Mirrors scroll / sidebar / theme. */
export const OVERLAY_SINGLETON_KEY = "@ailuracode/alpine-overlay/default";

type Listener = (detail: OverlayChangeDetail) => void;

/**
 * Headless overlay controller. Private state is held via `#field`
 * syntax; the public surface is getters + imperative methods.
 */
export class OverlayController {
  readonly #id: string;
  #state: OverlayState | null = null;
  readonly #slots: SlotState;
  #root: HTMLElement | null = null;
  #configured = false;
  #destroyed = false;
  readonly #listeners = new Map<keyof OverlayEvents, Set<Listener>>();

  constructor(options?: OverlayOptions) {
    this.#id = `${OVERLAY_SINGLETON_KEY}#${Math.random().toString(36).slice(2, 9)}`;
    // Eagerly normalize so a controller that is created without
    // configure() still has sensible defaults — `register()` will
    // lazily allocate slots even before `configure()` runs.
    const normalized = normalizeOverlayOptions(options);
    this.#slots = createSlotState(normalized.baseZIndex, normalized.step);
    if (options !== undefined) {
      this.configure(options);
    }
  }

  /** Stable controller id — exposed for debugging / cross-keying. */
  get id(): string {
    return this.#id;
  }

  /** Snapshot of the current state, or `null` when destroyed. */
  get state(): OverlayState {
    if (this.#destroyed) {
      throw new OverlayError(
        `Overlay controller "${this.#id}" was destroyed.`,
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
    if (this.#destroyed) {
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
      // root change on a live stack is also risky — only honor it
      // when the new root is a non-null `HTMLElement` (string
      // re-resolve is fine; null/HTMLElement swap mid-stack would
      // orphan references). For simplicity, ignore root changes
      // when the stack is non-empty.
      return;
    }

    // Stack is empty — first-time configure (or re-configure with
    // empty stack). Apply options in place.
    Object.assign(this.#slots as object, {
      baseZIndex: normalized.baseZIndex,
      step: normalized.step,
    });

    this.#root = resolveOrCreatePortalRoot(normalized.root, safeDocument());
    this.#configured = true;
  }

  /**
   * Idempotent. Allocates a slot for `(plugin, id)` and returns the
   * z-index. When the pair is already registered, the existing
   * z-index is returned and no `change` event fires.
   */
  register(plugin: string, id: string): number {
    if (this.#destroyed) {
      throw new OverlayError(
        `Cannot register on destroyed overlay controller.`,
        "OVERLAY_NOT_CONFIGURED"
      );
    }
    assertNonEmptyPluginId(plugin, id);

    // Lazy portal materialization so a controller that never calls
    // `configure()` still resolves a root the moment any register
    // hits a real DOM.
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
    if (this.#destroyed) {
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

  /** Returns `null` when the pair is unknown. */
  zIndexOf(plugin: string, id: string): number | null {
    if (this.#destroyed) {
      return null;
    }
    return this.#slots.slots.get(slotKeyOf(plugin, id)) ?? null;
  }

  isOpen(plugin: string, id: string): boolean {
    if (this.#destroyed) {
      return false;
    }
    return this.#slots.slots.has(slotKeyOf(plugin, id));
  }

  /**
   * Subscribes to `change` events. Returns an idempotent
   * unsubscribe function — calling it more than once is safe.
   */
  on(event: "change", listener: OverlayChangeListener): () => void {
    if (this.#destroyed) {
      return () => undefined;
    }
    const set = this.#listeners.get(event) ?? new Set<Listener>();
    set.add(listener as Listener);
    this.#listeners.set(event, set);
    return () => {
      set.delete(listener as Listener);
    };
  }

  /** Idempotent. No-op when the controller has not been mounted. */
  mount(): void {
    if (this.#destroyed) {
      throw new OverlayError(
        `Cannot mount destroyed overlay controller "${this.#id}".`,
        "OVERLAY_NOT_CONFIGURED"
      );
    }
    if (!this.#configured) {
      this.configure({});
    }
  }

  /** Idempotent. Clears the stack and removes every listener. */
  destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    this.#slots.slots.clear();
    this.#slots.stack.length = 0;
    this.#listeners.clear();
    this.#state = null;
    this.#root = null;
  }

  #emit(detail: OverlayChangeDetail): void {
    this.#state = {
      root: this.#root,
      stack: detail.stack,
      count: detail.stack.length,
      baseZIndex: this.#slots.baseZIndex,
      step: this.#slots.step,
    };
    const set = this.#listeners.get("change");
    if (!set) {
      return;
    }
    for (const listener of set) {
      listener(detail);
    }
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

/* Module-level singleton registry (kept inline because master
 * core does not yet export `createSingleton`). */
const singletons = new Map<string, OverlayController>();

/**
 * Returns the singleton controller, building + mounting one on the
 * first call. Mirrors the singleton pattern used by `theme`,
 * `lang`, `sidebar`, and `media`.
 */
export function createOverlay(options?: OverlayOptions): OverlayController {
  const existing = singletons.get(OVERLAY_SINGLETON_KEY);
  if (existing && !existing.state.count && !existing.state.root) {
    // Defensive: a controller whose state was reset (e.g. destroyed
    // by a test) should not be reused. Replace it.
    singletons.delete(OVERLAY_SINGLETON_KEY);
  }
  const live = singletons.get(OVERLAY_SINGLETON_KEY);
  if (live) {
    return live;
  }
  const controller = new OverlayController(options);
  controller.mount();
  singletons.set(OVERLAY_SINGLETON_KEY, controller);
  return controller;
}