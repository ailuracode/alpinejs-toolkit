import { BaseController, clearSingleton, createSingleton } from "@ailuracode/alpine-core";
import type { BatteryChange, BatteryEvents } from "./events.js";
import {
  type BatteryManagerLike,
  type BatterySnapshot,
  readBatteryState,
} from "./internal/battery.js";

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

export interface BatteryMagic extends BatterySnapshot {}

export const BATTERY_SINGLETON_KEY = "@ailuracode/alpine-env/battery";

const BATTERY_EVENTS = [
  "chargingchange",
  "levelchange",
  "chargingtimechange",
  "dischargingtimechange",
] as const;

export class BatteryController extends BaseController<BatteryEvents> {
  #state: BatteryChange = readBatteryState();

  get isAvailable(): boolean {
    return this.#state.isAvailable;
  }

  get level(): number | null {
    return this.#state.level;
  }

  get isCharging(): boolean {
    return this.#state.isCharging;
  }

  get chargingTime(): number | null {
    return this.#state.chargingTime;
  }

  get dischargingTime(): number | null {
    return this.#state.dischargingTime;
  }

  override mount(): void {
    super.mount();

    if (typeof navigator === "undefined") {
      return;
    }

    const nav = navigator as NavigatorWithBattery;

    if (typeof nav.getBattery !== "function") {
      this.#update();
      return;
    }

    void nav
      .getBattery()
      .then((battery) => {
        if (this.isDestroyed) {
          return;
        }

        const update = () => {
          this.#update(battery);
        };

        update();

        for (const eventName of BATTERY_EVENTS) {
          battery.addEventListener(eventName, update);
        }

        this.registerCleanup(() => {
          for (const eventName of BATTERY_EVENTS) {
            battery.removeEventListener(eventName, update);
          }
        });
      })
      .catch((error) => {
        this.#update();
        // biome-ignore lint/suspicious/noConsole: Battery API failures must be observable instead of silently swallowed.
        console.warn("[@ailuracode/alpine-env] Battery API unavailable.", error);
      });
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    super.destroy();
    clearSingleton(BATTERY_SINGLETON_KEY);
  }

  #update(manager?: BatteryManagerLike): void {
    this.#state = readBatteryState(manager);
    this.emit("change", this.#state);
  }
}

export function createBattery(): BatteryController {
  return createSingleton(BATTERY_SINGLETON_KEY, () => {
    const controller = new BatteryController();
    controller.mount();
    return controller;
  });
}
