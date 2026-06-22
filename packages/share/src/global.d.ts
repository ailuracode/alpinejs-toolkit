/// <reference types="@types/alpinejs" />

export type { ShareApi } from "./index.js";

declare global {
  namespace Alpine {
    interface Stores {
      share: import("./index.js").ShareApi;
    }

    interface Magics<T> {
      $share: import("./index.js").ShareApi;
    }
  }
}
