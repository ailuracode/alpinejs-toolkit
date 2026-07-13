import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  detectPlatformName,
  isAndroidDevice,
  isChromeOsDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  PLATFORM_NAMES,
  platformFlags,
  readPlatformState,
} from "../src/internal/platform.js";

function mockNavigator(props: Partial<Navigator> = {}) {
  const nav = {
    userAgent: "",
    platform: "",
    maxTouchPoints: 0,
    ...props,
  };
  vi.stubGlobal("navigator", nav);
  return nav;
}

describe("env/internal/platform", () => {
  let originalNavigator: unknown;

  beforeEach(() => {
    originalNavigator = (globalThis as Record<string, unknown>).navigator;
  });

  afterEach(() => {
    if (originalNavigator === undefined) {
      vi.unstubAllGlobals();
    } else {
      vi.stubGlobal("navigator", originalNavigator);
    }
  });

  describe("PLATFORM_NAMES", () => {
    it("contains all expected platforms", () => {
      expect(PLATFORM_NAMES).toContain("macos");
      expect(PLATFORM_NAMES).toContain("windows");
      expect(PLATFORM_NAMES).toContain("linux");
      expect(PLATFORM_NAMES).toContain("ios");
      expect(PLATFORM_NAMES).toContain("android");
      expect(PLATFORM_NAMES).toContain("chromeos");
      expect(PLATFORM_NAMES).toContain("unknown");
    });
  });

  describe("isIosDevice", () => {
    it("returns false when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isIosDevice()).toBe(false);
    });

    it("returns true for iPhone UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (iPhone)", platform: "" });
      expect(isIosDevice()).toBe(true);
    });

    it("returns true for iPad UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (iPad)", platform: "" });
      expect(isIosDevice()).toBe(true);
    });

    it("returns true for iPod UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (iPod)", platform: "" });
      expect(isIosDevice()).toBe(true);
    });

    it("returns true for iPadOS desktop UA (MacIntel + touch)", () => {
      mockNavigator({
        userAgent: "Mozilla/5.0 (Macintosh)",
        platform: "MacIntel",
        maxTouchPoints: 5,
      });
      expect(isIosDevice()).toBe(true);
    });

    it("returns false for MacIntel without touch", () => {
      mockNavigator({
        userAgent: "Mozilla/5.0 (Macintosh)",
        platform: "MacIntel",
        maxTouchPoints: 0,
      });
      expect(isIosDevice()).toBe(false);
    });
  });

  describe("isAndroidDevice", () => {
    it("returns false when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isAndroidDevice()).toBe(false);
    });

    it("returns true for Android UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Linux; Android 10)" });
      expect(isAndroidDevice()).toBe(true);
    });

    it("returns false for non-Android UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Windows NT 10.0)" });
      expect(isAndroidDevice()).toBe(false);
    });
  });

  describe("isChromeOsDevice", () => {
    it("returns false when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isChromeOsDevice()).toBe(false);
    });

    it("returns true for CrOS UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (X11; CrOS x86_64)" });
      expect(isChromeOsDevice()).toBe(true);
    });

    it("returns false for non-CrOS UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Windows NT 10.0)" });
      expect(isChromeOsDevice()).toBe(false);
    });
  });

  describe("isWindowsDevice", () => {
    it("returns false when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isWindowsDevice()).toBe(false);
    });

    it("returns true for Win platform", () => {
      mockNavigator({ userAgent: "", platform: "Win32" });
      expect(isWindowsDevice()).toBe(true);
    });

    it("returns true for Windows UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Windows NT 10.0)", platform: "" });
      expect(isWindowsDevice()).toBe(true);
    });

    it("returns true for windows client hint", () => {
      mockNavigator({
        userAgent: "",
        platform: "",
        userAgentData: { platform: "Windows" },
      } as Navigator);
      expect(isWindowsDevice()).toBe(true);
    });
  });

  describe("isMacDevice", () => {
    it("returns false for iOS device", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (iPhone)", platform: "" });
      expect(isMacDevice()).toBe(false);
    });

    it("returns false when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isMacDevice()).toBe(false);
    });

    it("returns true for Mac platform", () => {
      mockNavigator({ userAgent: "", platform: "MacIntel" });
      expect(isMacDevice()).toBe(true);
    });

    it("returns true for Macintosh UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "" });
      expect(isMacDevice()).toBe(true);
    });

    it("returns true for macos client hint", () => {
      mockNavigator({
        userAgent: "",
        platform: "",
        userAgentData: { platform: "macOS" },
      } as Navigator);
      expect(isMacDevice()).toBe(true);
    });
  });

  describe("isLinuxDevice", () => {
    it("returns false for Android device", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Linux; Android 10)" });
      expect(isLinuxDevice()).toBe(false);
    });

    it("returns false for ChromeOS device", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (X11; CrOS x86_64)" });
      expect(isLinuxDevice()).toBe(false);
    });

    it("returns false when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isLinuxDevice()).toBe(false);
    });

    it("returns true for Linux platform", () => {
      mockNavigator({ userAgent: "", platform: "Linux x86_64" });
      expect(isLinuxDevice()).toBe(true);
    });

    it("returns true for X11 UA", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (X11; Linux x86_64)", platform: "" });
      expect(isLinuxDevice()).toBe(true);
    });

    it("returns true for linux client hint", () => {
      mockNavigator({
        userAgent: "",
        platform: "",
        userAgentData: { platform: "Linux" },
      } as Navigator);
      expect(isLinuxDevice()).toBe(true);
    });
  });

  describe("detectPlatformName", () => {
    it("returns ios for iOS device", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (iPhone)", platform: "" });
      expect(detectPlatformName()).toBe("ios");
    });

    it("returns android for Android device", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (Linux; Android 10)" });
      expect(detectPlatformName()).toBe("android");
    });

    it("returns chromeos for ChromeOS device", () => {
      mockNavigator({ userAgent: "Mozilla/5.0 (X11; CrOS x86_64)" });
      expect(detectPlatformName()).toBe("chromeos");
    });

    it("returns windows for Windows device", () => {
      mockNavigator({ userAgent: "", platform: "Win32" });
      expect(detectPlatformName()).toBe("windows");
    });

    it("returns macos for Mac device", () => {
      mockNavigator({ userAgent: "", platform: "MacIntel" });
      expect(detectPlatformName()).toBe("macos");
    });

    it("returns linux for Linux device", () => {
      mockNavigator({ userAgent: "", platform: "Linux x86_64" });
      expect(detectPlatformName()).toBe("linux");
    });

    it("returns unknown for unrecognized device", () => {
      mockNavigator({ userAgent: "", platform: "" });
      expect(detectPlatformName()).toBe("unknown");
    });
  });

  describe("platformFlags", () => {
    it("returns correct flags for macos", () => {
      const flags = platformFlags("macos");
      expect(flags.isMac).toBe(true);
      expect(flags.isWindows).toBe(false);
    });

    it("returns correct flags for windows", () => {
      const flags = platformFlags("windows");
      expect(flags.isWindows).toBe(true);
      expect(flags.isMac).toBe(false);
    });

    it("returns correct flags for linux", () => {
      const flags = platformFlags("linux");
      expect(flags.isLinux).toBe(true);
    });

    it("returns correct flags for ios", () => {
      const flags = platformFlags("ios");
      expect(flags.isIos).toBe(true);
    });

    it("returns correct flags for android", () => {
      const flags = platformFlags("android");
      expect(flags.isAndroid).toBe(true);
    });

    it("returns correct flags for chromeos", () => {
      const flags = platformFlags("chromeos");
      expect(flags.isChromeos).toBe(true);
    });

    it("returns all false for unknown", () => {
      const flags = platformFlags("unknown");
      expect(flags.isMac).toBe(false);
      expect(flags.isWindows).toBe(false);
      expect(flags.isLinux).toBe(false);
      expect(flags.isIos).toBe(false);
      expect(flags.isAndroid).toBe(false);
      expect(flags.isChromeos).toBe(false);
    });
  });

  describe("readPlatformState", () => {
    it("returns snapshot with name and flags", () => {
      mockNavigator({ userAgent: "", platform: "MacIntel" });
      const state = readPlatformState();
      expect(state.name).toBe("macos");
      expect(state.isMac).toBe(true);
    });
  });
});
