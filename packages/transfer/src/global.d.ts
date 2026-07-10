/// <reference types="@types/alpinejs" />

import type { ClipboardMagic, ExportMagic, ShareMagic } from "./types.js";

export type { ClipboardMagic, ExportMagic, ShareMagic } from "./types.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $clipboard: ClipboardMagic;
      $export: ExportMagic;
      $share: ShareMagic;
    }
  }
}
