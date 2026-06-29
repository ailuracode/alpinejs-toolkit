/// <reference types="@types/alpinejs" />

import type { BatteryMagic } from "./battery.js";
import type { NetworkMagic } from "./network.js";
import type { PlatformMagic } from "./platform.js";
import type { VisibilityMagic } from "./visibility.js";

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
