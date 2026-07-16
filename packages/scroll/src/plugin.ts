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

import { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import { createScrollStore as buildStore } from "./alpine/store";
import { createScroll, type ScrollController } from "./controller";
import {
  DEFAULT_SCROLL_MAGIC_KEY,
  DEFAULT_SCROLL_STORE_KEY,
  type ScrollAlpine,
  type ScrollOptions,
  type ScrollPluginCallback,
  type ScrollState,
  type ScrollStore,
} from "./types";

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
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_SCROLL_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_SCROLL_MAGIC_KEY;

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

    bridgeControllerStore<ScrollStore, ScrollController>({
      alpine: Alpine,
      storeKey,
      magicKey,
      store,
      controller,
      packageName: "scroll",
      subscribe: (reactiveStore) =>
        controller.on("change", (detail) => {
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
        }),
    });
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
