import { BaseController, createSingleton, releaseSingleton } from "@ailuracode/alpine-core";
import { type BatteryManagerLike, readBatteryState } from "./internal/battery.js";
import { readNetworkState } from "./internal/network.js";
import { readPlatformState } from "./internal/platform.js";
import { readVisibilityState } from "./internal/visibility.js";
import type {
  BatteryMagic,
  CreateEnvOptions,
  EnvEvents,
  EnvState,
  NetworkMagic,
  PlatformMagic,
  VisibilityMagic,
} from "./types.js";

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManagerLike>;
};

const BATTERY_EVENTS = [
  "chargingchange",
  "levelchange",
  "chargingtimechange",
  "dischargingtimechange",
] as const;

const DEFAULT_NETWORK: NetworkMagic = {
  isOnline: true,
  isOffline: false,
};

const DEFAULT_VISIBILITY = {
  isVisible: true,
  isHidden: false,
  state: "visible",
} satisfies Omit<VisibilityMagic, "is">;

const DEFAULT_BATTERY: BatteryMagic = {
  isAvailable: false,
  level: null,
  isCharging: false,
  chargingTime: null,
  dischargingTime: null,
};

const DEFAULT_PLATFORM = {
  name: "unknown",
  isMac: false,
  isWindows: false,
  isLinux: false,
  isIos: false,
  isAndroid: false,
  isChromeos: false,
} satisfies Omit<PlatformMagic, "is">;

export const ENV_SINGLETON_KEY = "@ailuracode/alpine-env/default";

export class EnvController extends BaseController<EnvEvents> {
  #network: NetworkMagic = DEFAULT_NETWORK;
  #visibility: Omit<VisibilityMagic, "is"> = DEFAULT_VISIBILITY;
  #battery: BatteryMagic = DEFAULT_BATTERY;
  #platform: Omit<PlatformMagic, "is"> = DEFAULT_PLATFORM;
  #batteryError: unknown = null;

  get network(): NetworkMagic {
    return this.#network;
  }

  get visibility(): VisibilityMagic {
    return {
      ...this.#visibility,
      is: (state) => this.#visibility.state === state,
    };
  }

  get battery(): BatteryMagic {
    return this.#battery;
  }

  get platform(): PlatformMagic {
    return {
      ...this.#platform,
      is: (platform) => this.#platform.name === platform,
    };
  }

  get batteryError(): unknown {
    return this.#batteryError;
  }

  get state(): EnvState {
    return {
      network: this.network,
      visibility: this.visibility,
      battery: this.battery,
      platform: this.platform,
    };
  }

  override mount(): void {
    if (this.isMounted) {
      return;
    }

    super.mount();
    this.#network = readNetworkState();
    this.#visibility = readVisibilityState();
    this.#battery = readBatteryState();
    this.#platform = readPlatformState();

    if (typeof window !== "undefined") {
      const updateNetwork = () => {
        this.#network = readNetworkState();
        this.#emitChange();
      };

      window.addEventListener("online", updateNetwork);
      window.addEventListener("offline", updateNetwork);

      this.registerCleanup(() => {
        window.removeEventListener("online", updateNetwork);
        window.removeEventListener("offline", updateNetwork);
      });
    }

    if (typeof document !== "undefined") {
      const updateVisibility = () => {
        this.#visibility = readVisibilityState();
        this.#emitChange();
      };

      document.addEventListener("visibilitychange", updateVisibility);

      this.registerCleanup(() => {
        document.removeEventListener("visibilitychange", updateVisibility);
      });
    }

    if (typeof navigator !== "undefined") {
      const nav = navigator as NavigatorWithBattery;

      if (typeof nav.getBattery === "function") {
        void nav
          .getBattery()
          .then((battery) => {
            if (this.isDestroyed) {
              return;
            }

            const updateBattery = () => {
              this.#battery = readBatteryState(battery);
              this.#batteryError = null;
              this.#emitChange();
            };

            updateBattery();

            for (const eventName of BATTERY_EVENTS) {
              battery.addEventListener(eventName, updateBattery);
            }

            this.registerCleanup(() => {
              for (const eventName of BATTERY_EVENTS) {
                battery.removeEventListener(eventName, updateBattery);
              }
            });
          })
          .catch((error) => {
            this.#battery = readBatteryState();
            this.#batteryError = error;
            this.#emitChange();
          });
      }
    }

    this.#emitChange();
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    super.destroy();
    releaseSingleton(ENV_SINGLETON_KEY, this);
  }

  #emitChange(): void {
    this.emit("change", this.state);
  }
}

export function createEnv(options: CreateEnvOptions = {}): EnvController {
  const { scope } = options;
  return createSingleton(
    ENV_SINGLETON_KEY,
    () => {
      const controller = new EnvController();
      controller.mount();
      return controller;
    },
    { scope }
  );
}
