/// <reference types="@types/alpinejs" />

import type { ClipboardMagic } from "./clipboard.js";
import type { ExportMagic } from "./export.js";
import type { ShareMagic } from "./share.js";

export type { ClipboardMagic, ExportMagic, ShareMagic };

declare global {
  namespace Alpine {
    interface Magics<T> {
      $clipboard: ClipboardMagic;
      $export: ExportMagic;
      $share: ShareMagic;
    }
  }
}
