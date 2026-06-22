/// <reference types="@types/alpinejs" />

export type { ShareMagic, ShareStore } from "./index.js";

declare global {
  namespace Alpine {
    interface Stores {
      share: import("./index.js").ShareStore;
    }

    interface Magics<T> {
      $share: import("./index.js").ShareMagic;
    }
  }
}
