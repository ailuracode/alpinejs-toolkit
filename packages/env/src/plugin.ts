import type AlpineType from "alpinejs";
import { registerBatteryMagic } from "./battery.js";
import { registerNetworkMagic } from "./network.js";
import { registerPlatformMagic } from "./platform.js";
import { registerVisibilityMagic } from "./visibility.js";

export type { BatteryMagic, BatteryManagerLike } from "./battery.js";
export { readBatteryState, registerBatteryMagic } from "./battery.js";
export type { NetworkMagic } from "./network.js";
export { createNetworkState, readNetworkState, registerNetworkMagic } from "./network.js";
export type {
  PlatformFlags,
  PlatformMagic,
  PlatformName,
  PlatformSnapshot,
} from "./platform.js";
export {
  createPlatformState,
  detectPlatformName,
  isAndroidDevice,
  isChromeOsDevice,
  isIosDevice,
  PLATFORM_NAMES,
  platformFlags,
  readPlatformState,
  registerPlatformMagic,
} from "./platform.js";
export type { VisibilityMagic, VisibilitySnapshot, VisibilityState } from "./visibility.js";
export {
  createVisibilityState,
  readVisibilityState,
  registerVisibilityMagic,
  VISIBILITY_STATES,
} from "./visibility.js";

export type EnvPluginOptions = {
  /** Register `$network`. Default: `true`. */
  network?: boolean;
  /** Register `$visibility`. Default: `true`. */
  visibility?: boolean;
  /** Register `$battery`. Default: `true`. */
  battery?: boolean;
  /** Register `$platform`. Default: `true`. */
  platform?: boolean;
};

/** Registers browser environment magics: `$network`, `$visibility`, `$battery`, `$platform`. */
export default function envPlugin(options: EnvPluginOptions = {}): AlpineType.PluginCallback {
  const {
    network: enableNetwork = true,
    visibility: enableVisibility = true,
    battery: enableBattery = true,
    platform: enablePlatform = true,
  } = options;

  return function registerEnv(Alpine) {
    if (enableNetwork) {
      registerNetworkMagic(Alpine);
    }
    if (enableVisibility) {
      registerVisibilityMagic(Alpine);
    }
    if (enableBattery) {
      registerBatteryMagic(Alpine);
    }
    if (enablePlatform) {
      registerPlatformMagic(Alpine);
    }
  };
}

export {
  registerBatteryMagic as batteryPlugin,
  registerNetworkMagic as networkPlugin,
  registerPlatformMagic as platformPlugin,
  registerVisibilityMagic as visibilityPlugin,
};
