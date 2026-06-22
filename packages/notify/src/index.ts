import type AlpineType from "alpinejs";

export interface NotifyMagic {
  /** Whether the Web Notifications API is available in this environment. */
  isSupported(): boolean;
  /** Current notification permission (`granted`, `denied`, or `default`). */
  permission(): NotificationPermission;
  /** Prompt the user for notification permission when still `default`. */
  requestPermission(): Promise<NotificationPermission>;
  /** Show a notification when permission is `granted`; otherwise return `null`. */
  send(title: string, options?: NotificationOptions): Notification | null;
  /** Alias of `send` — only creates a notification when permission is already `granted`. */
  sendIfPermitted(title: string, options?: NotificationOptions): Notification | null;
  /** Close a notification without throwing. */
  close(notification: Notification): void;
}

function getNotificationConstructor(): typeof Notification | null {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const ctor = Reflect.get(globalThis, "Notification");
  return typeof ctor === "function" ? (ctor as typeof Notification) : null;
}

/** Returns whether the Web Notifications API is available. */
export function isNotifySupported(): boolean {
  return getNotificationConstructor() !== null;
}

/** Returns the current notification permission, or `denied` when unsupported. */
export function getNotifyPermission(): NotificationPermission {
  const NotificationCtor = getNotificationConstructor();
  if (!NotificationCtor) {
    return "denied";
  }

  return NotificationCtor.permission;
}

/** Requests notification permission when the API is supported and permission is `default`. */
export async function requestNotifyPermission(): Promise<NotificationPermission> {
  const NotificationCtor = getNotificationConstructor();
  if (!NotificationCtor) {
    return "denied";
  }

  const current = NotificationCtor.permission;
  if (current === "granted" || current === "denied") {
    return current;
  }

  try {
    return await NotificationCtor.requestPermission();
  } catch {
    return "denied";
  }
}

/** Creates a notification when permission is `granted`; never throws. */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  const NotificationCtor = getNotificationConstructor();
  if (NotificationCtor?.permission !== "granted") {
    return null;
  }

  try {
    return new NotificationCtor(title, options);
  } catch {
    return null;
  }
}

/** Closes a notification without throwing. */
export function closeNotification(notification: Notification): void {
  try {
    notification.close();
  } catch {
    // Notifications may be unavailable or already closed.
  }
}

/** Builds the `$notify` magic API object. */
export function createNotifyMagic(): NotifyMagic {
  return {
    isSupported: isNotifySupported,
    permission: getNotifyPermission,
    requestPermission: requestNotifyPermission,
    send: sendNotification,
    sendIfPermitted: sendNotification,
    close: closeNotification,
  };
}

/** Alpine.js notify plugin. Registers magic `$notify`. */
export default function notifyPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("notify", () => createNotifyMagic());
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $notify: NotifyMagic;
    }
  }
}
