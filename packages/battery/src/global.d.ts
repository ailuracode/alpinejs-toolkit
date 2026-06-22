/// <reference types="@types/alpinejs" />

export interface BatteryMagic {
  isAvailable: boolean;
  level: number | null;
  isCharging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $battery: BatteryMagic;
    }
  }
}
