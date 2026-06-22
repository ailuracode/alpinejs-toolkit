/// <reference types="@types/alpinejs" />

export type PlatformName =
  | "macos"
  | "windows"
  | "linux"
  | "ios"
  | "android"
  | "chromeos"
  | "unknown";

export interface PlatformMagic {
  name: PlatformName;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isChromeos: boolean;
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $platform: PlatformMagic;
    }
  }
}
