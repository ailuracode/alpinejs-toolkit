import type {} from "alpinejs";

declare global {
  namespace Alpine {
    interface Stores {
      keyboard: import("./types.js").KeyboardStore;
    }

    interface Magics<T> {
      $keyboard: import("./types.js").KeyboardMagic;
    }
  }
}
