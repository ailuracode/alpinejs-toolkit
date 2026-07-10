/// <reference types="@types/alpinejs" />

import type { IdleMagic, WakeLockMagic } from "./types.js";

export type { IdleMagic, IdleScreenState, IdleUserState, WakeLockMagic } from "./types.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $wakelock: WakeLockMagic;
      $idle: IdleMagic;
    }
  }
}
