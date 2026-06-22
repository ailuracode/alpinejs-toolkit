/// <reference types="@types/alpinejs" />

export type { ShareMagic } from "./index.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $share: import("./index.js").ShareMagic;
    }
  }
}
