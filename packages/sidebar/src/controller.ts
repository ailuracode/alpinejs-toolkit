/**
 * Sidebar controller — the framework-agnostic core of
 * `@ailuracode/alpine-sidebar` v2.0. Composes a
 * {@link ToggleController} from `@ailuracode/alpine-toggle` to model
 * the boolean `visible` state machine and layers two browser
 * side-effects on top: an `Escape` keydown listener (via
 * {@link attachEscapeListener}) and a `matchMedia` breakpoint
 * observer (via {@link observeBreakpoint}).
 *
 * Responsibilities:
 *
 * 1. **State** — owns `visible` (via the inner toggle) and the
 *    observed `matchesBreakpoint` value.
 * 2. **Transitions** — `show`, `hide`, `toggle`, `reset`. Each
 *    emits a typed `change` event with the previous snapshot and a
 *    `source` discriminator.
 * 3. **Side-effects** — `mount()` wires both listeners; `destroy()`
 *    detaches them via `BaseController.registerCleanup`.
 * 4. **Subscriptions** — typed `on('change', listener)` from the
 *    inherited bus.
 *
 * Composition with `ToggleController`:
 *
 * - The inner toggle owns the boolean state machine — `set`,
 *   `toggle`, `reset`, and the basic `change` event with
 *   `source: 'user' | 'reset' | 'initialization'`.
 * - `show` / `hide` / `toggle` / `reset` on the sidebar set
 *   `#pendingSource` first so the bridge overrides the toggle's
 *   own `source` for the next emit. Identity mapping for `user`
 *   and `reset`; `initialization` is dropped in the bridge (the
 *   sidebar emits its own via the `mount()` microtask).
 * - Escape and breakpoint paths route through the inner toggle
 *   (via `#pendingSource = 'escape' | 'breakpoint'`) so the bridge
 *   can stamp the correct `source` on the re-emitted event.
 *
 * SSR behaviour (per locked design decision Q2):
 *
 * - The constructor is pure — no `window`, `document`, or
 *   `matchMedia` access.
 * - `matchesBreakpoint` defaults to `false` and stays there under
 *   SSR (no listener attached, no query evaluated).
 * - `show()` / `hide()` / `toggle()` mutate `visible` even under
 *   SSR — the listener wiring is what changes, not the state
 *   machine.
 * - `destroy()` is idempotent under SSR (no listeners to detach).
 */

import {
  BaseController,
  clearSingleton,
  createSingleton,
  generateId,
  safeMatchMedia,
} from "@ailuracode/alpine-core";
import type { ToggleChangeDetail } from "@ailuracode/alpine-toggle";
import { ToggleController } from "@ailuracode/alpine-toggle";
import type { SidebarEvents } from "./events";
import { observeBreakpoint } from "./internal/breakpoint-observer";
import { attachEscapeListener } from "./internal/escape-listener";
import type {
  CreateSidebarOptions,
  SidebarBreakpointOption,
  SidebarChangeDetail,
  SidebarChangeSource,
  SidebarManager,
} from "./types";

/**
 * Stable registry key for the singleton sidebar controller. The
 * `options.id` is **not** part of the key — `id` identifies the
 * controller instance, but two `createSidebar()` calls in the same
 * document describe the same singleton (the document's sidebar).
 * Tests should call `clearSingleton(SIDEBAR_SINGLETON_KEY)` (or
 * `clearAllSingletons()`) to reset between cases.
 */
const SIDEBAR_SINGLETON_KEY = "@ailuracode/alpine-sidebar/default";

/**
 * Subset of {@link SidebarChangeSource} that the bridge layer maps
 * directly from the inner toggle. Escape / breakpoint / initialization
 * have their own emit paths so they are excluded here.
 */
type MappedSidebarChangeSource = Extract<SidebarChangeSource, "user" | "reset">;

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link SidebarController}. The constructor itself stays pure; the
 * factory wires the browser-touching `mount()` step.
 *
 * Singleton guarantee: at most one live `SidebarController` per
 * document. Repeated calls return the existing instance; the
 * controller's `destroy()` releases the slot so the next call
 * builds a fresh one. Direct `new SidebarController(...)` is still
 * supported for tests and advanced consumers — only the
 * `createSidebar()` factory enforces uniqueness.
 */
export function createSidebar(options: CreateSidebarOptions = {}): SidebarController {
  return createSingleton(SIDEBAR_SINGLETON_KEY, () => {
    const controller = new SidebarController(options);
    controller.mount();
    return controller;
  });
}

/**
 * Headless controller for `@ailuracode/alpine-sidebar`. Owns the
 * boolean `visible` state machine via composition with
 * {@link ToggleController}, plus the keyboard / breakpoint
 * side-effects and a typed `change` event with a five-source
 * discriminator.
 *
 * Mounts automatically inside `createSidebar()` so the factory is
 * the public entrypoint. Tests can construct directly with
 * `new SidebarController(options)` and call `mount()` themselves.
 */
export class SidebarController extends BaseController<SidebarEvents> implements SidebarManager {
  /**
   * Inner toggle models the `visible` boolean. `set` / `toggle` /
   * `reset` route through it; `show` / `hide` set `#pendingSource`
   * first so the bridge stamps the correct `source` on the
   * re-emitted event.
   */
  readonly #toggle: ToggleController<true, false, undefined, boolean>;

  /** Snapshot used to build the `previous` field on the sidebar emit. */
  #lastVisible = false;
  #lastMatchesBreakpoint = false;

  /**
   * When non-null, the next `change` event from the inner toggle is
   * re-emitted with this `source` instead of the toggle's own
   * `'user'`. Set by `show` / `hide` / `toggle` / `reset` and the
   * escape / breakpoint paths. Cleared after each bridge run.
   */
  #pendingSource: SidebarChangeSource | null = null;

  /** Cached snapshot of the last `KeyboardEvent` / `MediaQueryListEvent`. */
  #pendingEvent: KeyboardEvent | MediaQueryListEvent | undefined = undefined;

  /** Configuration knobs — stored once at construction. */
  readonly #closeOnEscape: boolean;
  readonly #closeOnOverlayClick: boolean;
  readonly #breakpointOption: SidebarBreakpointOption | undefined;
  readonly #initial: boolean;

  /**
   * Snapshot of `matchesBreakpoint` at construction time. `reset()`
   * restores this value so consumers can use it as the canonical
   * "no-side-effects" breakpoint read.
   */
  #initialMatchesBreakpoint = false;

  constructor(options: CreateSidebarOptions = {}) {
    const id = options.id ?? generateId("sidebar");
    super(id);

    this.#closeOnEscape = options.closeOnEscape !== false;
    this.#closeOnOverlayClick = options.closeOnOverlayClick !== false;
    this.#breakpointOption = options.breakpoint;
    this.#initial = options.initial ?? false;

    this.#toggle = new ToggleController<true, false, undefined, boolean>({
      states: { on: true, off: false },
      initial: this.#initial,
      id: `${id}-visible`,
    });

    // Forward every toggle `change` to the sidebar-level emit so
    // listeners receive the full `visible` / `matchesBreakpoint` /
    // `source` shape. Sidebar emits its own `initialization` event
    // in `mount()` after wiring the side-effects; the toggle's
    // queued init microtask is intentionally NOT consumed here.
    this.#toggle.on("change", this.#onToggleChange);

    // Wire inner toggle teardown through the controller's
    // `CleanupStack` so `destroy()` detaches both this controller
    // and the inner toggle in one go.
    this.registerCleanup(this.#toggle.destroy.bind(this.#toggle));
  }

  // ── Public state surface ────────────────────────────────────────

  get visible(): boolean {
    return this.#toggle.value;
  }

  get isVisible(): boolean {
    return this.#toggle.value;
  }

  /**
   * Whether an overlay should be rendered. True when the sidebar is
   * visible AND `closeOnOverlayClick` was not disabled in options.
   */
  get hasOverlay(): boolean {
    return this.#toggle.value && this.#closeOnOverlayClick;
  }

  /**
   * Last observed `MediaQueryListEvent.matches` value. `false` when
   * no breakpoint option is configured OR under SSR (where the
   * observer short-circuits to a no-op).
   */
  get matchesBreakpoint(): boolean {
    return this.#lastMatchesBreakpoint;
  }

  // ── Public commands ─────────────────────────────────────────────

  show(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#pendingSource = "user";
    this.#pendingEvent = undefined;
    this.#toggle.set(true);
  }

  hide(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#pendingSource = "user";
    this.#pendingEvent = undefined;
    this.#toggle.set(false);
  }

  toggle(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#pendingSource = "user";
    this.#pendingEvent = undefined;
    this.#toggle.toggle();
  }

  /**
   * Hides the sidebar and restores `matchesBreakpoint` to its
   * construction-time value. Emits `change` with `source: 'reset'`
   * (or `'user'` if the controller was already in the reset state
   * — `reset()` is a no-op when both snapshots already match).
   */
  reset(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#pendingSource = "reset";
    this.#pendingEvent = undefined;
    this.#lastMatchesBreakpoint = this.#initialMatchesBreakpoint;
    this.#toggle.reset();
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  /**
   * Tears down every side effect. Idempotent — subsequent calls are
   * no-ops. Also releases the singleton slot so the next
   * `createSidebar()` call builds a fresh controller.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    super.destroy();
    clearSingleton(SIDEBAR_SINGLETON_KEY);
  }

  /**
   * Starts the controller's side effects. Idempotent — `BaseController`
   * guards the phase. Calling it after `destroy()` throws
   * `CONTROLLER_DESTROYED`.
   */
  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();
    this.#init();
  }

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Predictable init order:
   *
   * 1. Read the breakpoint query (if configured) and seed
   *    `matchesBreakpoint` from `mql.matches`.
   * 2. Wire the escape keydown listener (if `closeOnEscape`).
   * 3. Wire the breakpoint observer (if configured).
   * 4. Schedule the sidebar `initialization` event on a microtask.
   *    The toggle's own init microtask runs too but its `change`
   *    listener is attached from the constructor — the toggle's
   *    `source: 'initialization'` is dropped in the bridge, so the
   *    sidebar emits one init event with the correct shape.
   */
  #init(): void {
    if (this.#breakpointOption) {
      const initialMedia = safeMatchMedia(this.#breakpointOption.query);
      if (initialMedia !== null) {
        this.#lastMatchesBreakpoint = initialMedia.matches;
        this.#initialMatchesBreakpoint = initialMedia.matches;
      }
    }

    if (this.#closeOnEscape) {
      const cleanup = attachEscapeListener((event) => {
        if (this.isDestroyed) {
          return;
        }
        if (!this.#toggle.value) {
          return;
        }
        this.#pendingSource = "escape";
        this.#pendingEvent = event;
        this.#toggle.set(false);
      });
      this.registerCleanup(cleanup);
    }

    if (this.#breakpointOption) {
      const cleanup = observeBreakpoint(this.#breakpointOption.query, (event) => {
        if (this.isDestroyed) {
          return;
        }
        this.#lastMatchesBreakpoint = event.matches;
        this.#pendingSource = "breakpoint";
        this.#pendingEvent = event;

        // Auto-hide when the query stops matching AND the
        // consumer opted into the v1 behaviour. The `'keep'`
        // discriminator only updates `matchesBreakpoint` so the
        // `change` event still fires (visible stays put).
        if (!event.matches && this.#breakpointOption?.onMismatch === "hide" && this.#toggle.value) {
          this.#toggle.set(false);
        } else {
          // No toggle transition — emit the breakpoint change
          // directly so consumers see `matchesBreakpoint` flips
          // even when visibility does not move.
          this.#emitChange();
        }
      });
      this.registerCleanup(cleanup);
    }

    queueMicrotask(() => {
      if (this.isDestroyed) {
        return;
      }
      this.#pendingSource = "initialization";
      this.#pendingEvent = undefined;
      this.#emitChange();
      this.#pendingSource = null;
    });
  }

  // ── Toggle → sidebar event bridge ──────────────────────────────

  /**
   * Receives every `change` event from the inner toggle. The
   * toggle's queued init microtask fires immediately after
   * construction with `source: 'initialization'` and
   * `previous: null`; we drop that one and let the sidebar emit
   * its own init event with the full shape.
   *
   * `pendingSource` overrides the source for escape / breakpoint /
   * reset paths so they surface correctly instead of as `user`.
   */
  #onToggleChange = (detail: ToggleChangeDetail<true, false, undefined>): void => {
    if (detail.source === "initialization") {
      // Skip the toggle's own init event — sidebar emits its own
      // from `#init()` with the correct shape.
      return;
    }
    this.#pendingSource = this.#pendingSource ?? this.#mapToggleSource(detail.source);
    this.#emitChange();
  };

  /**
   * Maps a `ToggleChangeSource` to the equivalent
   * `SidebarChangeSource`. The toggle's user / reset vocabulary
   * is a subset of the sidebar's, so this is identity — kept
   * explicit so adding a new source to either side becomes a
   * deliberate decision (the compiler will flag the omission).
   */
  #mapToggleSource(toggleSource: MappedSidebarChangeSource): MappedSidebarChangeSource {
    return toggleSource;
  }

  // ── Emitter ────────────────────────────────────────────────────

  /**
   * Emits the sidebar `change` event with the cached snapshots.
   * Clears the pending-source / pending-event flags after each
   * emit so the next transition falls back to identity mapping.
   */
  #emitChange(): void {
    if (this.isDestroyed) {
      this.#pendingSource = null;
      this.#pendingEvent = undefined;
      return;
    }

    const visible = this.#toggle.value;
    const matchesBreakpoint = this.#lastMatchesBreakpoint;
    const source: SidebarChangeSource = this.#pendingSource ?? "user";
    const previous: SidebarChangeDetail["previous"] =
      source === "initialization"
        ? null
        : {
            visible: this.#lastVisible,
            matchesBreakpoint: this.#lastMatchesBreakpoint,
          };

    const detail: SidebarChangeDetail = {
      visible,
      matchesBreakpoint,
      source,
      previous,
    };

    // The optional `event` field is only meaningful for
    // escape / breakpoint sources. Add it conditionally so the
    // shape stays clean for the other three sources.
    const event = this.#pendingEvent;
    if (event !== undefined && (source === "escape" || source === "breakpoint")) {
      const enriched: SidebarChangeDetail = {
        visible: detail.visible,
        matchesBreakpoint: detail.matchesBreakpoint,
        source: detail.source,
        previous: detail.previous,
        event,
      };
      this.#snapshot(visible, matchesBreakpoint);
      this.#pendingSource = null;
      this.#pendingEvent = undefined;
      this.emit("change", enriched);
      return;
    }

    this.#snapshot(visible, matchesBreakpoint);
    this.#pendingSource = null;
    this.#pendingEvent = undefined;
    this.emit("change", detail);
  }

  /**
   * Snapshots the just-emitted state so the NEXT emit's
   * `previous` reflects the correct prior value.
   */
  #snapshot(visible: boolean, matchesBreakpoint: boolean): void {
    this.#lastVisible = visible;
    this.#lastMatchesBreakpoint = matchesBreakpoint;
  }
}
