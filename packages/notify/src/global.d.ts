/// <reference types="@types/alpinejs" />

import type { NotifyMagic } from "./types";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $notify: NotifyMagic;
    }
  }
}
