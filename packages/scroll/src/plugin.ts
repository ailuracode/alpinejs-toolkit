/**
 * Alpine.js integration for `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Thin adapter that wires {@link ScrollController} into
 * `$store.scroll` and the `$scroll` magic. Every command forwards to
 * the controller (see `AGENTS.md` for the integration contract).
 *
 * Reactive proxy re-target pattern is handled by
 * `bindControllerStore` from `@ailuracode/alpine-core/alpine`.
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import { createScrollStore as buildStore } from "./alpine/store";
import { createScroll, type ScrollController } from "./controller";
import type {
  ScrollAlpine,
  ScrollChangeDetail,
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
    const Alpine = alpine as unknown as ScrollAlpine;
    const controller = createScroll(options);

    bindControllerStore<ScrollStore, ScrollChangeDetail>({
      alpine: Alpine,
      storeKey: SCROLL_STORE_KEY,
      store: buildStore(controller),
      controller,
      sync: (reactiveStore, detail) => {
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
      },
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
