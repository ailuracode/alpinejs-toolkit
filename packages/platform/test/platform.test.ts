import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import platformPlugin, {
  createPlatformState,
  detectPlatformName,
  isAndroidDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  PLATFORM_NAMES,
  type PlatformMagic,
  type PlatformName,
  type PlatformSnapshot,
  readPlatformState,
} from "../src/index.js";

function installNavigator(navigator: Record<string, unknown>): void {
  vi.stubGlobal("navigator", navigator);
}

function removeNavigatorMock(): void {
  vi.unstubAllGlobals();
}

describe("@ailuracode/alpinejs-platform type inference", () => {
  it("exports literal platform names", () => {
    expectTypeOf(PLATFORM_NAMES).toEqualTypeOf<
      readonly ["macos", "windows", "linux", "ios", "android", "chromeos", "unknown"]
    >();
  });

  it("types detectPlatformName() as PlatformName", () => {
    installNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });

    expectTypeOf(detectPlatformName()).toEqualTypeOf<PlatformName>();
  });

  it("types readPlatformState() snapshot", () => {
    installNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });

    const snapshot = readPlatformState();

    expectTypeOf(snapshot).toEqualTypeOf<PlatformSnapshot>();
    expectTypeOf(snapshot.name).toEqualTypeOf<PlatformName>();
    expectTypeOf(snapshot.isWindows).toEqualTypeOf<boolean>();
  });

  it("types $platform magic", () => {
    installNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });

    const { platform } = createMagicHarness(platformPlugin) as { platform: PlatformMagic };

    expectTypeOf(platform).toEqualTypeOf<PlatformMagic>();
    expectTypeOf(platform.name).toEqualTypeOf<PlatformName>();
    expectTypeOf(platform.is).parameters.toEqualTypeOf<[platform: PlatformName]>();
    expectTypeOf(platform.is("windows")).toEqualTypeOf<boolean>();
  });

  it("types createPlatformState()", () => {
    const state = createPlatformState();

    expectTypeOf(state).toExtend<PlatformMagic>();
    expectTypeOf(state.isMac).toEqualTypeOf<boolean>();
  });
});

describe("@ailuracode/alpinejs-platform", () => {
  afterEach(() => {
    removeNavigatorMock();
  });

  describe("detectPlatformName", () => {
    it("detects Windows", () => {
      installNavigator({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      expect(detectPlatformName()).toBe("windows");
      expect(isWindowsDevice()).toBe(true);
      expect(readPlatformState()).toEqual({
        name: "windows",
        isMac: false,
        isWindows: true,
        isLinux: false,
        isIos: false,
        isAndroid: false,
        isChromeos: false,
      });
    });

    it("detects desktop macOS", () => {
      installNavigator({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0,
      });

      expect(detectPlatformName()).toBe("macos");
      expect(isMacDevice()).toBe(true);
    });

    it("detects desktop Linux", () => {
      installNavigator({
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      });

      expect(detectPlatformName()).toBe("linux");
      expect(isLinuxDevice()).toBe(true);
    });

    it("detects iOS Safari", () => {
      installNavigator({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        platform: "iPhone",
        maxTouchPoints: 5,
      });

      expect(detectPlatformName()).toBe("ios");
      expect(isIosDevice()).toBe(true);
      expect(isMacDevice()).toBe(false);
    });

    it("detects iPadOS desktop UA", () => {
      installNavigator({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      });

      expect(detectPlatformName()).toBe("ios");
      expect(isIosDevice()).toBe(true);
      expect(isMacDevice()).toBe(false);
    });

    it("detects Android", () => {
      installNavigator({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      });

      expect(detectPlatformName()).toBe("android");
      expect(isAndroidDevice()).toBe(true);
      expect(isLinuxDevice()).toBe(false);
    });

    it("detects ChromeOS", () => {
      installNavigator({
        userAgent:
          "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.133 Safari/537.36",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      });

      expect(detectPlatformName()).toBe("chromeos");
      expect(readPlatformState().isChromeos).toBe(true);
      expect(isLinuxDevice()).toBe(false);
    });

    it("prefers Client Hints platform when available", () => {
      installNavigator({
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
        userAgentData: {
          platform: "Windows",
        },
      });

      expect(detectPlatformName()).toBe("windows");
    });

    it("returns unknown when navigator is unavailable", () => {
      vi.stubGlobal("navigator", undefined);

      expect(detectPlatformName()).toBe("unknown");
      expect(isIosDevice()).toBe(false);
    });
  });

  describe("plugin registration", () => {
    it("registers $platform with resolved state", () => {
      installNavigator({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        platform: "Win32",
        maxTouchPoints: 0,
      });

      const { platform } = createMagicHarness(platformPlugin) as { platform: PlatformMagic };

      expect(platform.name).toBe("windows");
      expect(platform.isWindows).toBe(true);
      expect(platform.isMac).toBe(false);
      expect(platform.is("windows")).toBe(true);
      expect(platform.is("macos")).toBe(false);
    });
  });
});
