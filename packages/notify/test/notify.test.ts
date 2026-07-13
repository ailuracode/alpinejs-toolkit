import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import notifyPlugin, {
  closeNotification,
  createNotifyMagic,
  getNotifyPermission,
  isIosDevice,
  isNotifySupported,
  type NotifyMagic,
  registerNotifyServiceWorker,
  requestNotifyPermission,
  requiresHomeScreenInstall,
  requiresServiceWorkerNotifications,
  resetNotifyServiceWorkerRegistrationForTests,
  sendNotification,
  sendNotificationAsync,
  supportsDirectNotifications,
} from "../src/index.js";

interface MockNotificationInstance {
  title: string;
  options?: NotificationOptions;
  closed: boolean;
  close(): void;
}

interface MockNotificationConstructor {
  new (title: string, options?: NotificationOptions): MockNotificationInstance;
  permission: NotificationPermission;
  requestPermission: ReturnType<typeof vi.fn>;
}

interface MockServiceWorkerRegistration {
  showNotification: ReturnType<typeof vi.fn>;
}

function installMockNotification(
  permission: NotificationPermission = "default",
  options: { throwOnConstruct?: boolean } = {}
): MockNotificationConstructor {
  const MockNotification = vi.fn(function MockNotification(
    this: MockNotificationInstance,
    title: string,
    notificationOptions?: NotificationOptions
  ) {
    if (options.throwOnConstruct) {
      throw new TypeError("Notification construction failed");
    }

    this.title = title;
    this.options = notificationOptions;
    this.closed = false;
    this.close = vi.fn(() => {
      this.closed = true;
    });
  }) as unknown as MockNotificationConstructor;

  MockNotification.permission = permission;
  MockNotification.requestPermission = vi.fn(() => Promise.resolve("granted"));

  vi.stubGlobal("Notification", MockNotification);

  return MockNotification;
}

function installSecureContext(): void {
  vi.stubGlobal("isSecureContext", true);
}

function installDesktopEnvironment(): void {
  installSecureContext();
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    platform: "Win32",
    maxTouchPoints: 0,
    serviceWorker: undefined,
  });
}

function installAndroidEnvironment(showNotification = vi.fn(() => Promise.resolve())): {
  register: ReturnType<typeof vi.fn>;
  showNotification: ReturnType<typeof vi.fn>;
} {
  installSecureContext();

  const registration: MockServiceWorkerRegistration = {
    showNotification,
  };

  const register = vi.fn(() => Promise.resolve(registration));

  vi.stubGlobal("navigator", {
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    platform: "Linux armv8l",
    maxTouchPoints: 5,
    serviceWorker: {
      register,
      ready: Promise.resolve(registration),
    },
  });

  return { register, showNotification };
}

function installIosBrowserEnvironment(): void {
  installSecureContext();
  vi.stubGlobal("window", {
    matchMedia: vi.fn(() => ({ matches: false })),
  });
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    platform: "iPhone",
    maxTouchPoints: 5,
    standalone: false,
    serviceWorker: {
      register: vi.fn(),
      ready: Promise.resolve({ showNotification: vi.fn() }),
    },
  });
}

function installIosStandaloneEnvironment(): void {
  installSecureContext();
  vi.stubGlobal("window", {
    matchMedia: vi.fn((query: string) => ({
      matches: query.includes("standalone"),
    })),
  });
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    platform: "iPhone",
    maxTouchPoints: 5,
    standalone: true,
    serviceWorker: {
      register: vi.fn(() =>
        Promise.resolve({
          showNotification: vi.fn(() => Promise.resolve()),
        })
      ),
      ready: Promise.resolve({
        showNotification: vi.fn(() => Promise.resolve()),
      }),
    },
  });
}

function removeEnvironmentMocks(): void {
  vi.unstubAllGlobals();
}

describe("@ailuracode/alpine-notify", () => {
  afterEach(() => {
    resetNotifyServiceWorkerRegistrationForTests();
    removeEnvironmentMocks();
  });

  describe("module helpers", () => {
    beforeEach(() => {
      installDesktopEnvironment();
    });

    it("reports unsupported when Notification is missing", () => {
      removeEnvironmentMocks();
      installDesktopEnvironment();
      Reflect.deleteProperty(globalThis, "Notification");

      expect(isNotifySupported()).toBe(false);
      expect(getNotifyPermission()).toBe("denied");
      expect(sendNotification("Hello")).toBeNull();
    });

    it("returns permission from Notification", () => {
      installMockNotification("granted");
      expect(getNotifyPermission()).toBe("granted");
    });

    it("sends a notification when permission is granted on desktop", () => {
      const MockNotification = installMockNotification("granted");

      const notification = sendNotification("Hello", { body: "World" });

      expect(notification).not.toBeNull();
      expect(MockNotification).toHaveBeenCalledWith("Hello", { body: "World" });
      expect(notification?.title).toBe("Hello");
    });

    it("returns null when permission is denied", () => {
      const MockNotification = installMockNotification("denied");

      expect(sendNotification("Hello")).toBeNull();
      expect(MockNotification).not.toHaveBeenCalled();
    });

    it("returns null when permission is default", () => {
      const MockNotification = installMockNotification("default");

      expect(sendNotification("Hello")).toBeNull();
      expect(MockNotification).not.toHaveBeenCalled();
    });

    it("returns null when Notification construction throws", () => {
      installMockNotification("granted", { throwOnConstruct: true });

      expect(sendNotification("Hello")).toBeNull();
    });

    it("requests permission when default", async () => {
      const MockNotification = installMockNotification("default");

      await expect(requestNotifyPermission()).resolves.toBe("granted");
      expect(MockNotification.requestPermission).toHaveBeenCalledOnce();
    });

    it("skips requestPermission when already granted", async () => {
      const MockNotification = installMockNotification("granted");

      await expect(requestNotifyPermission()).resolves.toBe("granted");
      expect(MockNotification.requestPermission).not.toHaveBeenCalled();
    });

    it("returns denied without prompting when already denied", async () => {
      const MockNotification = installMockNotification("denied");

      await expect(requestNotifyPermission()).resolves.toBe("denied");
      expect(MockNotification.requestPermission).not.toHaveBeenCalled();
    });

    it("returns denied when requestPermission throws", async () => {
      const MockNotification = installMockNotification("default");
      MockNotification.requestPermission.mockRejectedValue(new Error("blocked"));

      await expect(requestNotifyPermission()).resolves.toBe("denied");
    });

    it("closes notifications without throwing", () => {
      const notification = {
        close: vi.fn(),
      } as unknown as Notification;

      closeNotification(notification);
      expect(notification.close).toHaveBeenCalledOnce();
    });

    it("swallows errors from close", () => {
      const notification = {
        close: vi.fn(() => {
          throw new Error("already closed");
        }),
      } as unknown as Notification;

      expect(() => closeNotification(notification)).not.toThrow();
    });
  });

  describe("mobile service worker delivery", () => {
    it("detects Android as requiring service worker notifications", () => {
      installAndroidEnvironment();
      installMockNotification("granted");

      expect(requiresServiceWorkerNotifications()).toBe(true);
      expect(supportsDirectNotifications()).toBe(false);
      expect(isNotifySupported()).toBe(true);
    });

    it("uses showNotification on Android instead of the constructor", async () => {
      const { showNotification } = installAndroidEnvironment();
      installMockNotification("granted");

      await expect(sendNotificationAsync("Hello", { body: "World" })).resolves.toBeNull();
      expect(showNotification).toHaveBeenCalledWith("Hello", { body: "World" });
    });

    it("registers the default service worker on Android", async () => {
      const { register } = installAndroidEnvironment();
      installMockNotification("default");

      await registerNotifyServiceWorker();

      expect(register).toHaveBeenCalledWith("/notify-sw.js");
    });

    it("registers the service worker before requesting permission on mobile", async () => {
      const { register } = installAndroidEnvironment();
      const MockNotification = installMockNotification("default");

      await requestNotifyPermission();

      expect(register).toHaveBeenCalledWith("/notify-sw.js");
      expect(MockNotification.requestPermission).toHaveBeenCalledOnce();
    });
  });

  describe("iOS environment detection", () => {
    it("requires Home Screen install in iOS Safari tabs", () => {
      installIosBrowserEnvironment();
      Reflect.deleteProperty(globalThis, "Notification");

      expect(isIosDevice()).toBe(true);
      expect(requiresHomeScreenInstall()).toBe(true);
      expect(isNotifySupported()).toBe(false);
    });

    it("supports notifications in an installed iOS web app", () => {
      installIosStandaloneEnvironment();
      installMockNotification("granted");

      expect(requiresHomeScreenInstall()).toBe(false);
      expect(isNotifySupported()).toBe(true);
    });
  });

  describe("createNotifyMagic", () => {
    beforeEach(() => {
      installDesktopEnvironment();
      installMockNotification("granted");
    });

    it("exposes the full API surface", () => {
      const notify = createNotifyMagic();

      expect(notify.isSupported).toBe(true);
      expect(notify.requiresHomeScreenInstall).toBe(false);
      expect(notify.permission).toBe("granted");
      expect(typeof notify.requestPermission).toBe("function");
      expect(typeof notify.send).toBe("function");
      expect(typeof notify.sendAsync).toBe("function");
      expect(typeof notify.sendIfPermitted).toBe("function");
      expect(typeof notify.sendIfPermittedAsync).toBe("function");
      expect(typeof notify.close).toBe("function");
    });

    it("sendIfPermitted matches send behavior", () => {
      const notify = createNotifyMagic();

      const sent = notify.send("A");
      const permitted = notify.sendIfPermitted("B");

      expect(sent?.title).toBe("A");
      expect(permitted?.title).toBe("B");
    });
  });

  describe("Alpine plugin", () => {
    beforeEach(() => {
      installDesktopEnvironment();
      installMockNotification("granted");
    });

    it("registers $notify magic when called directly", () => {
      const { notify } = createMagicHarness(notifyPlugin) as { notify: NotifyMagic };

      expect(notify.isSupported).toBe(true);
      expect(notify.send("Hello")?.title).toBe("Hello");
    });

    it("registers $notify magic when called as a factory", () => {
      const register = notifyPlugin({ serviceWorkerUrl: "/custom-sw.js" });
      if (!register) {
        throw new Error("Expected notifyPlugin factory to return a register function");
      }

      const { notify } = createMagicHarness(register) as {
        notify: NotifyMagic;
      };

      expect(notify.isSupported).toBe(true);
    });
  });
});
