/// <reference types="@types/alpinejs" />

import type { IdleMagic, WakeLockMagic } from "./index.js";

export type { IdleMagic, IdleScreenState, IdleUserState, WakeLockMagic } from "./index.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $wakelock: WakeLockMagic;
      $idle: IdleMagic;
    }
  }
}
