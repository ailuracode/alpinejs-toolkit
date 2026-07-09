/**
 * Alpine.js integration for `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Thin adapter that wires {@link ScrollController} into
 * `$store.scroll` and the `$scroll` magic. Every command forwards to
 * the controller (see `AGENTS.md` for the integration contract).
 *
 * Reactive proxy re-target pattern (mirrors `packages/theme/src/plugin.ts`
 * and `packages/sidebar/src/plugin.ts`):
 *
 * 1. `Alpine.store('scroll', store)` registers the bare store.
 * 2. `Alpine.store('scroll')` re-fetches the reactive proxy Alpine
 *    wraps the store in. Mutations land on this proxy, not the bare
 *    object — otherwise `x-text` bindings never re-render.
 * 3. `controller.on('change', detail => mutate proxy)` is the single
 *    subscription that bridges the headless controller to Alpine's
 *    reactivity. The controller's `change` event is the canonical
 *    source of truth for state transitions; `lock` and `section`
 *    events are NOT mirrored separately because they already fold
 *    into `change` via the controller's lock / section handlers.
 * 4. `$scroll` magic returns the same reactive store proxy so
 *    `x-text="$scroll.locked"` and `x-text="$store.scroll.locked"`
 *    are interchangeable.
 * 5. `Alpine.cleanup(() => controller.destroy())` releases the
 *    controller when the host tears down (guarded by a
 *    `typeof === "function"` check for older Alpine versions).
 */

import type { Alpine } from "alpinejs";
import { createScrollStore as buildStore } from "./alpine/store";
import { createScroll, type ScrollController } from "./controller";
import type {
  ScrollAlpine,
  ScrollOptions,
  ScrollPluginCallback,
  ScrollState,
  ScrollStore,
} from "./types";

/** Key under which the scroll store is registered on `$store`. */
const SCROLL_STORE_KEY = "scroll";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link ScrollOptions} to configure the singleton
 * {@link ScrollController}, or `{}` for the package defaults. See
 * `AGENTS.md` for the integration contract.
 *
 * Singleton guarantee: every call returns the same controller for the
 * current document (via `createScroll()`). Multiple `scrollPlugin()`
 * registrations share state. The controller is destroyed when the
 * Alpine runtime tears down via `Alpine.cleanup` (when available),
 * releasing the singleton slot.
 */
export function scrollPlugin(options: ScrollOptions = {}): ScrollPluginCallback {
  return function registerScroll(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `ScrollAlpine`.
    const Alpine = alpine as unknown as ScrollAlpine;

    // `createScroll()` resolves the singleton — repeated calls return
    // the same controller. `mount()` runs once per fresh build (the
    // singleton factory guards it).
    const controller = createScroll(options);

    const store = buildStore(controller);
    Alpine.store(SCROLL_STORE_KEY, store);
    // Alpine wraps the value in a reactive proxy on registration.
    // Re-target the subscription so mutations land on the proxy, not
    // on the unwrapped original — otherwise `x-text` bindings on the
    // `$scroll` magic / `$store.scroll` never re-render. We cache the
    // proxy so the `$scroll` magic returns the SAME reference instead
    // of forcing Alpine to re-resolve the store on every access.
    const reactiveStore = Alpine.store(SCROLL_STORE_KEY);
    const unsubscribe = controller.on("change", (detail) => {
      const state: ScrollState = detail.state;
      reactiveStore.x = state.x;
      reactiveStore.y = state.y;
      reactiveStore.direction = state.direction;
      reactiveStore.atTop = state.atTop;
      reactiveStore.atBottom = state.atBottom;
      reactiveStore.progress = state.progress;
      reactiveStore.locked = state.locked;
      reactiveStore.lockCount = state.lockCount;
      reactiveStore.activeSection = state.activeSection;
      reactiveStore.visibleSections = state.visibleSections.slice();
    });
    Alpine.magic(SCROLL_STORE_KEY, () => reactiveStore);

    // Forward destroy() through Alpine's cleanup mechanism when
    // available. Older Alpine versions don't expose `cleanup`; the
    // integration guards every call with a `typeof === "function"`
    // check. We tear the subscription down first so a second plugin
    // registration does not leak listeners through the same closure.
    // `controller.destroy()` clears the singleton slot, so a fresh
    // `createScroll()` call after teardown builds a brand-new
    // controller.
    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        unsubscribe();
        controller.destroy();
      });
    }
  };
}

/**
 * Builds the {@link ScrollStore} Alpine exposes through
 * `$store.scroll`. The store's reads delegate to the controller's
 * getters; mutations go through the controller's semantic commands.
 *
 * Fields are direct properties (NOT getters) so the plugin's
 * `change` handler can write to them when bridging controller state
 * into the Alpine reactive proxy. Tests that need live reads call
 * `controller.state` directly.
 *
 * Standalone consumers (non-Alpine) can subscribe themselves and
 * forward updates the same way the adapter does.
 */
export function createScrollStore(controller: ScrollController): ScrollStore {
  const initial = controller.state;
  return {
    x: initial.x,
    y: initial.y,
    direction: initial.direction,
    atTop: initial.atTop,
    atBottom: initial.atBottom,
    progress: initial.progress,
    locked: initial.locked,
    lockCount: initial.lockCount,
    activeSection: initial.activeSection,
    visibleSections: initial.visibleSections,
    scrollIntoView(target) {
      controller.scrollIntoView(target);
    },
    by(delta) {
      controller.by(delta);
    },
    toTop() {
      controller.toTop();
    },
    toBottom() {
      controller.toBottom();
    },
    lock(reason = "store") {
      return controller.lockWithHandle(reason);
    },
    unlock(handle) {
      controller.unlock(handle);
    },
    unlockAll() {
      controller.unlockAll();
    },
  };
}
