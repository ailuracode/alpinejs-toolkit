/// <reference types="@types/alpinejs" />

export type { DownloadMagic } from "./index.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $download: import("./index.js").DownloadMagic;
    }
  }
}
