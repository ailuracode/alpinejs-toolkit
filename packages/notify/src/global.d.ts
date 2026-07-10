/// <reference types="@types/alpinejs" />

declare global {
  namespace Alpine {
    interface Magics<T> {
      $notify: import("./controller.js").NotifyMagic;
    }
  }
}
