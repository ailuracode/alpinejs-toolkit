/// <reference types="@types/alpinejs" />

export type { ExportMagic } from "./index.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $export: import("./index.js").ExportMagic;
    }
  }
}
