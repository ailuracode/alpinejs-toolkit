/// <reference types="@types/alpinejs" />

import type { BatteryMagic, NetworkMagic, PlatformMagic, VisibilityMagic } from "./types.js";

export type { BatteryMagic, NetworkMagic, PlatformMagic, VisibilityMagic };

declare global {
  namespace Alpine {
    interface Magics<T> {
      $battery: BatteryMagic;
      $network: NetworkMagic;
      $platform: PlatformMagic;
      $visibility: VisibilityMagic;
    }
  }
}
