/**
 * Builds the {@link ScrollStore} Alpine exposes through
 * `$store.scroll`.
 *
 * Reads delegate to the controller's getters; mutations go through
 * the controller's semantic commands. The plugin's `register()`
 * re-targets the subscription so mutations land on the Alpine
 * reactive proxy, not the bare store.
 *
 * The fields are direct properties (NOT getters) so the plugin's
 * `change` handler can write to them when bridging controller state
 * into the Alpine reactive proxy. Tests that need live reads call
 * `controller.state` directly.
 */

import type { ScrollController } from "../controller";
import type { ScrollStore } from "../types";

export function createScrollStore(controller: ScrollController): ScrollStore {
  const initial = controller.state;
  const store: ScrollStore = {
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
  return store;
}
