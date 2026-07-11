import type AlpineType from "alpinejs";
import { BatteryController, type BatteryMagic, createBattery } from "./battery-controller.js";
import type { BatteryManagerLike } from "./internal/battery.js";
import {
  detectPlatformName,
  isAndroidDevice,
  isChromeOsDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  PLATFORM_NAMES,
  type PlatformFlags,
  type PlatformName,
  type PlatformSnapshot,
  platformFlags,
  readPlatformState,
} from "./internal/platform.js";
import {
  VISIBILITY_STATES,
  type VisibilitySnapshot,
  type VisibilityState,
} from "./internal/visibility.js";
import { createNetwork, NetworkController, type NetworkMagic } from "./network-controller.js";
import { createPlatform, PlatformController, type PlatformMagic } from "./platform-controller.js";
import {
  createVisibility,
  VisibilityController,
  type VisibilityMagic,
} from "./visibility-controller.js";

export type {
  BatteryMagic,
  BatteryManagerLike,
  NetworkMagic,
  PlatformFlags,
  PlatformMagic,
  PlatformName,
  PlatformSnapshot,
  VisibilityMagic,
  VisibilitySnapshot,
  VisibilityState,
};
export {
  BatteryController,
  createBattery,
  createNetwork,
  createPlatform,
  createVisibility,
  detectPlatformName,
  isAndroidDevice,
  isChromeOsDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  NetworkController,
  PLATFORM_NAMES,
  PlatformController,
  platformFlags,
  readPlatformState,
  VISIBILITY_STATES,
  VisibilityController,
};

interface AlpineAugmented {
  cleanup?(callback: () => void): void;
}

interface AlpineInstall {
  magic(name: string, factory: () => unknown): void;
  reactive<T>(value: T): T;
}

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

  return function registerEnv(alpine) {
    const Alpine = alpine as AlpineType.Alpine & AlpineAugmented;
    const typedAlpine = alpine as unknown as AlpineInstall;
    const cleanups: Array<() => void> = [];

    if (enableNetwork) {
      const controller = createNetwork();
      const reactiveNetwork = typedAlpine.reactive({
        isOnline: controller.isOnline,
        isOffline: controller.isOffline,
      });

      const unsubscribe = controller.on("change", (detail) => {
        reactiveNetwork.isOnline = detail.isOnline;
        reactiveNetwork.isOffline = detail.isOffline;
      });

      typedAlpine.magic("network", () => reactiveNetwork as NetworkMagic);
      cleanups.push(unsubscribe);
      cleanups.push(() => controller.destroy());
    }

    if (enableVisibility) {
      const controller = createVisibility();
      const reactiveVisibility = typedAlpine.reactive({
        isVisible: controller.isVisible,
        isHidden: controller.isHidden,
        state: controller.state,
        is: (state: VisibilityState) => controller.is(state),
      });

      const unsubscribe = controller.on("change", (detail) => {
        reactiveVisibility.isVisible = detail.isVisible;
        reactiveVisibility.isHidden = detail.isHidden;
        reactiveVisibility.state = detail.state;
      });

      typedAlpine.magic("visibility", () => reactiveVisibility as VisibilityMagic);
      cleanups.push(unsubscribe);
      cleanups.push(() => controller.destroy());
    }

    if (enableBattery) {
      const controller = createBattery();
      const reactiveBattery = typedAlpine.reactive({
        isAvailable: controller.isAvailable,
        level: controller.level,
        isCharging: controller.isCharging,
        chargingTime: controller.chargingTime,
        dischargingTime: controller.dischargingTime,
      });

      const unsubscribe = controller.on("change", (detail) => {
        reactiveBattery.isAvailable = detail.isAvailable;
        reactiveBattery.level = detail.level;
        reactiveBattery.isCharging = detail.isCharging;
        reactiveBattery.chargingTime = detail.chargingTime;
        reactiveBattery.dischargingTime = detail.dischargingTime;
      });

      typedAlpine.magic("battery", () => reactiveBattery as BatteryMagic);
      cleanups.push(unsubscribe);
      cleanups.push(() => controller.destroy());
    }

    if (enablePlatform) {
      const controller = createPlatform();
      const reactivePlatform = typedAlpine.reactive({
        get name() {
          return controller.name;
        },
        get isMac() {
          return controller.isMac;
        },
        get isWindows() {
          return controller.isWindows;
        },
        get isLinux() {
          return controller.isLinux;
        },
        get isIos() {
          return controller.isIos;
        },
        get isAndroid() {
          return controller.isAndroid;
        },
        get isChromeos() {
          return controller.isChromeos;
        },
        is: (platform: PlatformName) => controller.is(platform),
      });

      typedAlpine.magic("platform", () => reactivePlatform as PlatformMagic);
      cleanups.push(() => controller.destroy());
    }

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        for (const cleanup of cleanups) {
          cleanup();
        }
      });
    }
  };
}

export const networkPlugin = envPlugin({
  network: true,
  visibility: false,
  battery: false,
  platform: false,
});

export const visibilityPlugin = envPlugin({
  network: false,
  visibility: true,
  battery: false,
  platform: false,
});

export const batteryPlugin = envPlugin({
  network: false,
  visibility: false,
  battery: true,
  platform: false,
});

export const platformPlugin = envPlugin({
  network: false,
  visibility: false,
  battery: false,
  platform: true,
});
