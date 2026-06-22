import { afterEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import notifyPlugin, {
  closeNotification,
  createNotifyMagic,
  getNotifyPermission,
  isNotifySupported,
  type NotifyMagic,
  requestNotifyPermission,
  sendNotification,
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

function removeMockNotification(): void {
  vi.unstubAllGlobals();
}

describe("@ailuracode/alpine-notify", () => {
  afterEach(() => {
    removeMockNotification();
  });

  describe("module helpers", () => {
    it("reports unsupported when Notification is missing", () => {
      removeMockNotification();
      Reflect.deleteProperty(globalThis, "Notification");

      expect(isNotifySupported()).toBe(false);
      expect(getNotifyPermission()).toBe("denied");
      expect(sendNotification("Hello")).toBeNull();
    });

    it("returns permission from Notification", () => {
      installMockNotification("granted");
      expect(getNotifyPermission()).toBe("granted");
    });

    it("sends a notification when permission is granted", () => {
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

  describe("createNotifyMagic", () => {
    it("exposes the full API surface", () => {
      installMockNotification("granted");
      const notify = createNotifyMagic();

      expect(notify.isSupported()).toBe(true);
      expect(notify.permission()).toBe("granted");
      expect(typeof notify.requestPermission).toBe("function");
      expect(typeof notify.send).toBe("function");
      expect(typeof notify.sendIfPermitted).toBe("function");
      expect(typeof notify.close).toBe("function");
    });

    it("sendIfPermitted matches send behavior", () => {
      installMockNotification("granted");
      const notify = createNotifyMagic();

      const sent = notify.send("A");
      const permitted = notify.sendIfPermitted("B");

      expect(sent?.title).toBe("A");
      expect(permitted?.title).toBe("B");
    });
  });

  describe("Alpine plugin", () => {
    it("registers $notify magic", () => {
      installMockNotification("granted");

      const { notify } = createMagicHarness(notifyPlugin) as { notify: NotifyMagic };

      expect(notify.isSupported()).toBe(true);
      expect(notify.send("Hello")?.title).toBe("Hello");
    });
  });
});
