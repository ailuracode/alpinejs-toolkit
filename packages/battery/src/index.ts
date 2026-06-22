import type AlpineType from "alpinejs";

export interface BatteryMagic {
  isAvailable: boolean;
  level: number | null;
  isCharging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

interface BatteryManagerLike {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListener): void;
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

function normalizeTime(seconds: number): number | null {
  return Number.isFinite(seconds) ? seconds : null;
}

/** Reads battery state from a BatteryManager, or unavailable defaults. */
export function readBatteryState(manager?: BatteryManagerLike): BatteryMagic {
  if (!manager) {
    return {
      isAvailable: false,
      level: null,
      isCharging: false,
      chargingTime: null,
      dischargingTime: null,
    };
  }

  return {
    isAvailable: true,
    level: manager.level,
    isCharging: manager.charging,
    chargingTime: normalizeTime(manager.chargingTime),
    dischargingTime: normalizeTime(manager.dischargingTime),
  };
}

/** Alpine.js battery plugin. Registers reactive magic `$battery`. */
export default function batteryPlugin(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive<BatteryMagic>(readBatteryState());

  Alpine.magic("battery", () => state);

  const nav = navigator as NavigatorWithBattery;
  if (typeof nav.getBattery !== "function") {
    return;
  }

  nav
    .getBattery()
    .then((battery) => {
      const update = () => {
        Object.assign(state, readBatteryState(battery));
      };

      update();
      battery.addEventListener("chargingchange", update);
      battery.addEventListener("levelchange", update);
      battery.addEventListener("chargingtimechange", update);
      battery.addEventListener("dischargingtimechange", update);
    })
    .catch(() => {
      // API present but unavailable — keep isAvailable false
    });
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $battery: BatteryMagic;
    }
  }
}
