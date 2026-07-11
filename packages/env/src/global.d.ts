/// <reference types="@types/alpinejs" />

import type { BatteryMagic } from "./battery-controller.js";
import type { NetworkMagic } from "./network-controller.js";
import type { PlatformMagic } from "./platform-controller.js";
import type { VisibilityMagic } from "./visibility-controller.js";

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
