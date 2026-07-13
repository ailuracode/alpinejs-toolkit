/**
 * Alpine.js integration for `@ailuracode/alpine-media`.
 *
 * Thin adapter that wires {@link MediaController} into `$store.media`
 * and the `$media` magic. The store mirrors the controller's
 * surface; the `change` subscription reassigns the viewport fields
 * so Alpine's reactive proxy tracks the mutation (see `AGENTS.md`
 * for the integration contract).
 *
 * `mediaIntervals` is re-exported so consumers can assert `as const`
 * on their intervals array without losing literal type inference.
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import { createMedia, MEDIA_SINGLETON_KEY, MediaController } from "./controller";
import type {
  CreateMediaOptions,
  MediaAlpine,
  MediaChangeDetail,
  MediaInterval,
  MediaPluginCallback,
  MediaStore,
} from "./types";

/** Key under which the media store is registered on `$store`. */
export const MEDIA_STORE_KEY = "media";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateMediaOptions} to configure {@link MediaController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 *
 * Routes through {@link createMedia} so the Alpine integration and
 * the standalone factory share the same singleton slot — a second
 * `Alpine.plugin(mediaPlugin())` call returns the existing
 * controller, the bus subscription is properly torn down in
 * `Alpine.cleanup`, and `controller.destroy()` releases the slot.
 */
export function mediaPlugin<Name extends string = string>(
  options: CreateMediaOptions<Name> = {}
): MediaPluginCallback {
  return function registerMedia(alpine: Alpine): void {
    const Alpine = alpine as unknown as MediaAlpine;
    const controller = createMedia<Name>(options) as MediaController<Name>;

    bindControllerStore<MediaStore<Name>, MediaChangeDetail<Name>>({
      alpine: Alpine,
      storeKey: MEDIA_STORE_KEY,
      store: createMediaStore<Name>(controller),
      controller,
      sync: (reactiveStore, detail) => {
        syncMediaStoreMirror(reactiveStore, detail);
      },
    });
  };
}

/**
 * Builds the {@link MediaStore} Alpine exposes through `$store.media`.
 *
 * The store mirrors the controller's surface so every command Alpine
 * callers issue (`$store.media.refresh()`, `$store.media.is('mobile')`)
 * flows straight to the controller. Methods forward unconditionally —
 * the controller guards `isDestroyed` so a torn-down manager cannot
 * re-emit events.
 *
 * Reactivity split:
 *
 * - **Mutable viewport fields** (`width`, `height`, `breakpoint`) are
 *   plain values seeded from the controller. The plugin's `change`
 *   subscription reassigns them so Alpine's reactive proxy tracks
 *   the mutation.
 * - **Feature fields** (`prefersReducedMotion`, `prefersContrast`,
 *   `prefersColorScheme`, `hover`, `pointer`, `orientation`,
 *   `maxTouchPoints`) are GETTERS that delegate to the controller.
 *   The reactive proxy tracks each getter access, so the change
 *   event triggers a re-render that reads the fresh value — no
 *   manual mirror required.
 * - **Derived getters** (`isTouch`, `isCoarse`, `isFine`, `canHover`,
 *   `intervals`) delegate to the controller so the manager stays
 *   the single source of truth.
 * - **Commands** (`refresh*`, `snapshot`, `on`, `destroy`)
 *   forward to the controller.
 *
 * Standalone consumers (non-Alpine) read the same surface off the
 * controller returned by {@link createMedia} and skip the store
 * entirely.
 */
export function createMediaStore<Name extends string>(
  controller: MediaController<Name>
): MediaStore<Name> {
  const store = {
    id: controller.id,
    get isDestroyed() {
      return controller.isDestroyed;
    },

    // ── Mutable viewport fields — reassigned by the change subscriber ──
    width: controller.width,
    height: controller.height,
    breakpoint: controller.breakpoint,

    /**
     * Internal revision counter. Bumped on every `change` event from
     * the controller so Alpine's reactive proxy invalidates the feature
     * getters even when `width` / `height` / `breakpoint` did not move
     * (e.g. a `(pointer: coarse)` flip triggered by the Chrome DevTools
     * device toolbar). The counter is intentionally NOT part of the
     * public {@link MediaStore} surface — every getter below reads it
     * to register a dependency, and `syncMediaStoreMirror` mutates it.
     */
    __revision: 0,

    // ── Feature fields — getters so the proxy reads fresh values ──
    get prefersReducedMotion(): boolean {
      void this.__revision;
      return controller.prefersReducedMotion;
    },
    get prefersContrast(): MediaStore<Name>["prefersContrast"] {
      void this.__revision;
      return controller.prefersContrast;
    },
    get prefersColorScheme(): MediaStore<Name>["prefersColorScheme"] {
      void this.__revision;
      return controller.prefersColorScheme;
    },
    get hover(): MediaStore<Name>["hover"] {
      void this.__revision;
      return controller.hover;
    },
    get pointer(): MediaStore<Name>["pointer"] {
      void this.__revision;
      return controller.pointer;
    },
    get orientation(): MediaStore<Name>["orientation"] {
      void this.__revision;
      return controller.orientation;
    },
    get maxTouchPoints(): number {
      void this.__revision;
      return controller.maxTouchPoints;
    },

    // ── Read-only configured intervals ──────────────────────────
    get intervals(): readonly MediaInterval<Name>[] {
      void this.__revision;
      return controller.intervals;
    },

    // ── Derived getters ─────────────────────────────────────────
    get isTouch(): boolean {
      void this.__revision;
      return controller.isTouch;
    },
    get isCoarse(): boolean {
      void this.__revision;
      return controller.isCoarse;
    },
    get isFine(): boolean {
      void this.__revision;
      return controller.isFine;
    },
    get canHover(): boolean {
      void this.__revision;
      return controller.canHover;
    },

    // ── Commands ────────────────────────────────────────────────
    snapshot() {
      return controller.snapshot();
    },
    refresh(): boolean {
      return controller.refresh();
    },
    refreshWidth(): boolean {
      const changed = controller.refreshWidth();
      if (changed) {
        (store as { width: number }).width = controller.width;
      }
      return changed;
    },
    refreshHeight(): boolean {
      const changed = controller.refreshHeight();
      if (changed) {
        (store as { height: number }).height = controller.height;
      }
      return changed;
    },
    on(event: "change", listener: (detail: MediaChangeDetail<Name>) => void) {
      return controller.on(event, listener);
    },
    destroy() {
      controller.destroy();
    },
  };
  return store as MediaStore<Name>;
}

/**
 * Mirrors a {@link MediaChangeDetail} payload onto the reactive
 * store proxy so Alpine tracks the viewport mutation. Only the
 * viewport fields (width / height / breakpoint) live on the proxy
 * as mutable values — feature fields are getters, so they read
 * through the controller on every render and need no mirror.
 *
 * The `__revision` counter is bumped on every `change` event so the
 * feature getters register a dependency on it. Without the bump,
 * a `(pointer: coarse)` flip triggered by the Chrome DevTools
 * device toolbar would update the controller but leave Alpine's
 * `reactive()` proxy unaware — `width` / `height` / `breakpoint`
 * did not move, so no effect was invalidated and templates that
 * bind to `pointer` / `hover` / `isTouch` kept rendering the stale
 * value.
 */
function syncMediaStoreMirror<Name extends string>(
  store: MediaStore<Name>,
  detail: MediaChangeDetail<Name>
): void {
  const mutable = store as unknown as {
    width: number;
    height: number;
    breakpoint: Name;
    __revision: number;
  };
  const current = detail.current;
  mutable.width = current.width;
  mutable.height = current.height;
  mutable.breakpoint = current.breakpoint;
  mutable.__revision += 1;
}

/**
 * Re-exported so consumers can import the literal-type helper from
 * the package root without pulling the controller. Same shape as
 * before — returns the array unchanged so `as const` flows through
 * to the type system.
 */
export function mediaIntervals<const T extends readonly MediaInterval[]>(intervals: T): T {
  return intervals;
}

// Re-export the singleton key so tests and advanced consumers can
// target the slot directly (e.g. `clearSingleton(MEDIA_SINGLETON_KEY)`).
// Re-export the controller class so the standalone surface and the
// Alpine integration both land at the same import path.
// Re-export `createMedia` because the plugin delegates to it and
// consumers wiring the Alpine integration want the same factory
// when they need a standalone handle.
export { createMedia, MEDIA_SINGLETON_KEY, MediaController };
