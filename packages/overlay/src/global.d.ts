/// <reference types="@types/alpinejs" />

import type { OverlayMagicFacade, OverlayStore } from "./types.js";

export type {
  OverlayAlpine,
  OverlayChangeDetail,
  OverlayChangeListener,
  OverlayEvents,
  OverlayMagicFacade,
  OverlayOptions,
  OverlayStackEntry,
  OverlayState,
  OverlayStore,
} from "./types.js";

declare global {
  namespace Alpine {
    interface Stores {
      overlay: OverlayStore;
    }
    interface Magics<T> {
      $overlay: OverlayMagicFacade;
    }
  }
}

export {};