import type AlpineType from "alpinejs";

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

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

function getNavigator(): Navigator | undefined {
  return typeof navigator !== "undefined" ? navigator : undefined;
}

function getClientHintPlatform(): string | undefined {
  const nav = getNavigator() as NavigatorWithUserAgentData | undefined;
  return nav?.userAgentData?.platform?.toLowerCase();
}

/** Detects iOS/iPadOS (including iPadOS desktop UA). */
export function isIosDevice(): boolean {
  const nav = getNavigator();
  if (!nav) {
    return false;
  }

  const ua = nav.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) {
    return true;
  }

  return nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
}

/** Detects Android phones and tablets. */
export function isAndroidDevice(): boolean {
  const nav = getNavigator();
  if (!nav) {
    return false;
  }

  return /Android/i.test(nav.userAgent);
}

/** Detects ChromeOS devices. */
export function isChromeOsDevice(): boolean {
  const nav = getNavigator();
  if (!nav) {
    return false;
  }

  return /CrOS/i.test(nav.userAgent);
}

/** Detects desktop Windows. */
export function isWindowsDevice(): boolean {
  const nav = getNavigator();
  if (!nav) {
    return false;
  }

  const hint = getClientHintPlatform();
  if (hint === "windows") {
    return true;
  }

  return /Win/i.test(nav.platform) || /Windows/i.test(nav.userAgent);
}

/** Detects desktop macOS (excludes iOS/iPadOS). */
export function isMacDevice(): boolean {
  if (isIosDevice()) {
    return false;
  }

  const nav = getNavigator();
  if (!nav) {
    return false;
  }

  const hint = getClientHintPlatform();
  if (hint === "macos") {
    return true;
  }

  return /Mac/i.test(nav.platform) || /Macintosh/i.test(nav.userAgent);
}

/** Detects desktop Linux (excludes Android and ChromeOS). */
export function isLinuxDevice(): boolean {
  if (isAndroidDevice() || isChromeOsDevice()) {
    return false;
  }

  const nav = getNavigator();
  if (!nav) {
    return false;
  }

  const hint = getClientHintPlatform();
  if (hint === "linux") {
    return true;
  }

  return /Linux/i.test(nav.platform) || /X11/i.test(nav.userAgent);
}

/** Resolves the primary platform name for the current environment. */
export function detectPlatformName(): PlatformName {
  if (isIosDevice()) {
    return "ios";
  }
  if (isAndroidDevice()) {
    return "android";
  }
  if (isChromeOsDevice()) {
    return "chromeos";
  }
  if (isWindowsDevice()) {
    return "windows";
  }
  if (isMacDevice()) {
    return "macos";
  }
  if (isLinuxDevice()) {
    return "linux";
  }

  return "unknown";
}

/** Reads the current platform state from the environment. */
export function readPlatformState(): PlatformMagic {
  const name = detectPlatformName();

  return {
    name,
    isMac: name === "macos",
    isWindows: name === "windows",
    isLinux: name === "linux",
    isIos: name === "ios",
    isAndroid: name === "android",
    isChromeos: name === "chromeos",
  };
}

/** Alpine.js platform plugin. Registers reactive magic `$platform`. */
export default function platformPlugin(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive(readPlatformState());

  Alpine.magic("platform", () => state);
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $platform: PlatformMagic;
    }
  }
}
