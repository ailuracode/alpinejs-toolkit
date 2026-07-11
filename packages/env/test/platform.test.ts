import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlatformName, PlatformSnapshot } from "../src/index.js";
import {
  detectPlatformName,
  isAndroidDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  PLATFORM_NAMES,
  PlatformController,
  readPlatformState,
} from "../src/index.js";

function installNavigatorMock(mockNavigator: Record<string, unknown>): void {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: mockNavigator,
  });
}

describe("@ailuracode/alpine-env platform", () => {
  afterEach(() => {
    clearAllSingletons();
    vi.restoreAllMocks();
  });

  it("exports literal platform names", () => {
    expect(PLATFORM_NAMES).toEqual([
      "macos",
      "windows",
      "linux",
      "ios",
      "android",
      "chromeos",
      "unknown",
    ] satisfies readonly PlatformName[]);
  });

  it("detects Windows", () => {
    installNavigatorMock({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });

    expect(detectPlatformName()).toBe("windows");
    expect(isWindowsDevice()).toBe(true);
    expect(readPlatformState()).toEqual<PlatformSnapshot>({
      name: "windows",
      isMac: false,
      isWindows: true,
      isLinux: false,
      isIos: false,
      isAndroid: false,
      isChromeos: false,
    });
  });

  it("detects macOS, Linux, iOS, and Android heuristics", () => {
    installNavigatorMock({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
      platform: "MacIntel",
      maxTouchPoints: 0,
    });
    expect(isMacDevice()).toBe(true);

    installNavigatorMock({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      platform: "Linux x86_64",
      maxTouchPoints: 0,
    });
    expect(isLinuxDevice()).toBe(true);

    installNavigatorMock({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
      maxTouchPoints: 5,
    });
    expect(isIosDevice()).toBe(true);

    installNavigatorMock({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      maxTouchPoints: 5,
    });
    expect(isAndroidDevice()).toBe(true);
  });

  it("PlatformController exposes platform getters and is() helper", () => {
    installNavigatorMock({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });

    const controller = new PlatformController();

    controller.mount();

    expect(controller.name).toBe("windows");
    expect(controller.isWindows).toBe(true);
    expect(controller.isMac).toBe(false);
    expect(controller.is("windows")).toBe(true);
    expect(controller.is("macos")).toBe(false);

    expect(() => controller.destroy()).not.toThrow();
    expect(() => controller.destroy()).not.toThrow();
  });
});
