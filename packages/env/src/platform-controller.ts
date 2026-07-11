import { BaseController, clearSingleton, createSingleton } from "@ailuracode/alpine-core";
import type { PlatformEvents } from "./events.js";
import {
  detectPlatformName,
  type PlatformName,
  type PlatformSnapshot,
  platformFlags,
} from "./internal/platform.js";

export interface PlatformMagic extends PlatformSnapshot {
  is(platform: PlatformName): boolean;
}

export const PLATFORM_SINGLETON_KEY = "@ailuracode/alpine-env/platform";

export class PlatformController extends BaseController<PlatformEvents> {
  get name(): PlatformName {
    return detectPlatformName();
  }

  get isMac(): boolean {
    return platformFlags(this.name).isMac;
  }

  get isWindows(): boolean {
    return platformFlags(this.name).isWindows;
  }

  get isLinux(): boolean {
    return platformFlags(this.name).isLinux;
  }

  get isIos(): boolean {
    return platformFlags(this.name).isIos;
  }

  get isAndroid(): boolean {
    return platformFlags(this.name).isAndroid;
  }

  get isChromeos(): boolean {
    return platformFlags(this.name).isChromeos;
  }

  is(platform: PlatformName): boolean {
    return this.name === platform;
  }

  get snapshot(): PlatformSnapshot {
    return {
      name: this.name,
      isMac: this.isMac,
      isWindows: this.isWindows,
      isLinux: this.isLinux,
      isIos: this.isIos,
      isAndroid: this.isAndroid,
      isChromeos: this.isChromeos,
    };
  }

  override mount(): void {
    super.mount();
    this.emit("change", { name: this.name });
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    super.destroy();
    clearSingleton(PLATFORM_SINGLETON_KEY);
  }
}

export function createPlatform(): PlatformController {
  return createSingleton(PLATFORM_SINGLETON_KEY, () => {
    const controller = new PlatformController();
    controller.mount();
    return controller;
  });
}
