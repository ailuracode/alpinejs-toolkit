/**
 * Pure platform detection. Reads `navigator` (user agent, client
 * hints, touch points, etc.) and returns a primary platform name
 * plus per-platform boolean flags. Used by `PlatformController`'s
 * `name` / `is*` getters, which re-run on every read so any
 * browser-side change (e.g. user agent morphing in a WebView) is
 * reflected without explicit listeners.
 *
 * SSR-safe: when `navigator` is undefined the snapshot defaults to
 * `"unknown"` with all flags `false`.
 */

export const PLATFORM_NAMES = [
  "macos",
  "windows",
  "linux",
  "ios",
  "android",
  "chromeos",
  "unknown",
] as const;

export type PlatformName = (typeof PLATFORM_NAMES)[number];

export interface PlatformFlags {
  readonly isMac: boolean;
  readonly isWindows: boolean;
  readonly isLinux: boolean;
  readonly isIos: boolean;
  readonly isAndroid: boolean;
  readonly isChromeos: boolean;
}

export interface PlatformSnapshot extends PlatformFlags {
  readonly name: PlatformName;
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

/** Boolean flags for the given platform name. */
export function platformFlags(name: PlatformName): PlatformFlags {
  return {
    isMac: name === "macos",
    isWindows: name === "windows",
    isLinux: name === "linux",
    isIos: name === "ios",
    isAndroid: name === "android",
    isChromeos: name === "chromeos",
  };
}

/**
 * Reads a snapshot of the current platform state from the environment.
 * Convenience wrapper for tests and SSR adapters; callers that only
 * need `name` can call `detectPlatformName()` directly.
 */
export function readPlatformState(): PlatformSnapshot {
  const name = detectPlatformName();

  return {
    name,
    ...platformFlags(name),
  };
}
