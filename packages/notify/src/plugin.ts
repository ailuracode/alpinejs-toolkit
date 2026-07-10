import { isAndroidDevice, isIosDevice } from "@ailuracode/alpine-env";
import type AlpineType from "alpinejs";

export { isIosDevice } from "@ailuracode/alpine-env";

export interface NotifyPluginOptions {
  /** URL of the minimal service worker script (must be same-origin). */
  serviceWorkerUrl?: string;
  /** Register the service worker when the plugin loads. Default: true when `serviceWorkerUrl` is set. */
  autoRegisterServiceWorker?: boolean;
}

export interface NotifyMagic {
  /** Whether notifications can be shown in this environment. */
  readonly isSupported: boolean;
  /** Whether iOS/iPadOS requires adding the app to the Home Screen first. */
  readonly requiresHomeScreenInstall: boolean;
  /** Current notification permission (`granted`, `denied`, or `default`). */
  readonly permission: NotificationPermission;
  /** Prompt the user for notification permission when still `default`. */
  requestPermission(): Promise<NotificationPermission>;
  /** Show a notification when permission is `granted`; otherwise return `null`. */
  send(title: string, options?: NotificationOptions): Notification | null;
  /** Async variant that supports service-worker notifications on mobile. */
  sendAsync(title: string, options?: NotificationOptions): Promise<Notification | null>;
  /** Alias of `send` — only creates a notification when permission is already `granted`. */
  sendIfPermitted(title: string, options?: NotificationOptions): Notification | null;
  /** Async alias of `sendAsync`. */
  sendIfPermittedAsync(title: string, options?: NotificationOptions): Promise<Notification | null>;
  /** Close a notification without throwing. */
  close(notification: Notification): void;
}

type NotifyConfig = {
  serviceWorkerUrl?: string;
  autoRegisterServiceWorker: boolean;
};

const DEFAULT_SERVICE_WORKER_URL = "/notify-sw.js";

function getNotificationConstructor(): typeof Notification | null {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const ctor = Reflect.get(globalThis, "Notification");
  return typeof ctor === "function" ? (ctor as typeof Notification) : null;
}

function isSecureContext(): boolean {
  return typeof globalThis !== "undefined" && globalThis.isSecureContext === true;
}

function hasServiceWorkerSupport(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    navigator.serviceWorker != null
  );
}

/** True when the page runs as an installed web app (Home Screen on iOS). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    nav.standalone === true
  );
}

/** Mobile browsers expose `Notification` but require service-worker delivery. */
export function requiresServiceWorkerNotifications(): boolean {
  if (!(hasServiceWorkerSupport() && isSecureContext())) {
    return false;
  }

  return isIosDevice() || isAndroidDevice();
}

/** Returns whether direct `new Notification()` construction is available. */
export function supportsDirectNotifications(): boolean {
  const NotificationCtor = getNotificationConstructor();
  if (!NotificationCtor) {
    return false;
  }

  return !requiresServiceWorkerNotifications();
}

/** Returns whether iOS/iPadOS needs a Home Screen install before notifications work. */
export function requiresHomeScreenInstall(): boolean {
  return isIosDevice() && !isStandaloneDisplayMode();
}

/** Returns whether notifications can be shown in this environment. */
export function isNotifySupported(): boolean {
  if (!isSecureContext()) {
    return false;
  }

  if (requiresHomeScreenInstall()) {
    return false;
  }

  if (supportsDirectNotifications()) {
    return true;
  }

  return hasServiceWorkerSupport();
}

/** Returns the current notification permission, or `denied` when unsupported. */
export function getNotifyPermission(): NotificationPermission {
  const NotificationCtor = getNotificationConstructor();
  if (!NotificationCtor) {
    return "denied";
  }

  return NotificationCtor.permission;
}

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

function resolveNotifyConfig(options: NotifyPluginOptions = {}): NotifyConfig {
  const serviceWorkerUrl = options.serviceWorkerUrl ?? DEFAULT_SERVICE_WORKER_URL;
  const autoRegisterServiceWorker =
    options.autoRegisterServiceWorker ??
    (options.serviceWorkerUrl !== undefined || requiresServiceWorkerNotifications());

  return {
    serviceWorkerUrl: autoRegisterServiceWorker ? serviceWorkerUrl : undefined,
    autoRegisterServiceWorker,
  };
}

function getServiceWorkerRegistration(
  config: NotifyConfig
): Promise<ServiceWorkerRegistration | null> {
  if (!(config.serviceWorkerUrl && hasServiceWorkerSupport())) {
    return Promise.resolve(null);
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register(config.serviceWorkerUrl)
      .then((registration) => registration)
      .catch(() => null);
  }

  return serviceWorkerRegistrationPromise;
}

export function resetNotifyServiceWorkerRegistrationForTests(): void {
  serviceWorkerRegistrationPromise = null;
}

/** Registers the notify service worker when configured. Safe to call multiple times. */
export function registerNotifyServiceWorker(
  options: NotifyPluginOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  return getServiceWorkerRegistration(resolveNotifyConfig(options));
}

async function sendNotificationViaServiceWorker(
  title: string,
  options: NotificationOptions | undefined,
  config: NotifyConfig
): Promise<boolean> {
  const registration = await getServiceWorkerRegistration(config);
  if (!registration || getNotifyPermission() !== "granted") {
    return false;
  }

  try {
    await registration.showNotification(title, options);
    return true;
  } catch {
    return false;
  }
}

/** Requests notification permission when the API is supported and permission is `default`. */
export async function requestNotifyPermission(
  config: NotifyConfig = resolveNotifyConfig()
): Promise<NotificationPermission> {
  const NotificationCtor = getNotificationConstructor();
  if (!NotificationCtor) {
    return "denied";
  }

  if (requiresServiceWorkerNotifications()) {
    await getServiceWorkerRegistration(config);
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
  options?: NotificationOptions,
  config: NotifyConfig = resolveNotifyConfig()
): Notification | null {
  if (getNotifyPermission() !== "granted") {
    return null;
  }

  if (supportsDirectNotifications()) {
    const NotificationCtor = getNotificationConstructor();
    if (!NotificationCtor) {
      return null;
    }

    try {
      return new NotificationCtor(title, options);
    } catch {
      return null;
    }
  }

  if (requiresServiceWorkerNotifications()) {
    void sendNotificationViaServiceWorker(title, options, config);
  }

  return null;
}

/** Async notification delivery with service-worker support on mobile. */
export async function sendNotificationAsync(
  title: string,
  options?: NotificationOptions,
  config: NotifyConfig = resolveNotifyConfig()
): Promise<Notification | null> {
  if (getNotifyPermission() !== "granted") {
    return null;
  }

  if (supportsDirectNotifications()) {
    return sendNotification(title, options, config);
  }

  if (requiresServiceWorkerNotifications()) {
    await sendNotificationViaServiceWorker(title, options, config);
  }

  return null;
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
export function createNotifyMagic(options: NotifyPluginOptions = {}): NotifyMagic {
  const config = resolveNotifyConfig(options);

  const magic = {
    requestPermission: () => requestNotifyPermission(config),
    send: (title: string, notificationOptions?: NotificationOptions) =>
      sendNotification(title, notificationOptions, config),
    sendAsync: (title: string, notificationOptions?: NotificationOptions) =>
      sendNotificationAsync(title, notificationOptions, config),
    sendIfPermitted: (title: string, notificationOptions?: NotificationOptions) =>
      sendNotification(title, notificationOptions, config),
    sendIfPermittedAsync: (title: string, notificationOptions?: NotificationOptions) =>
      sendNotificationAsync(title, notificationOptions, config),
    close: closeNotification,
  } as NotifyMagic;

  Object.defineProperties(magic, {
    isSupported: { get: isNotifySupported },
    requiresHomeScreenInstall: { get: requiresHomeScreenInstall },
    permission: { get: getNotifyPermission },
  });

  return magic;
}

function registerNotifyPlugin(Alpine: AlpineType.Alpine, options: NotifyPluginOptions): void {
  const config = resolveNotifyConfig(options);

  if (config.autoRegisterServiceWorker) {
    void registerNotifyServiceWorker(options);
  }

  Alpine.magic("notify", () => createNotifyMagic(options));
}

/** Alpine.js notify plugin. Registers magic `$notify`. */
export default function notifyPlugin(
  optionsOrAlpine?: NotifyPluginOptions | AlpineType.Alpine
): undefined | ((Alpine: AlpineType.Alpine) => void) {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    registerNotifyPlugin(optionsOrAlpine as AlpineType.Alpine, {});
    return;
  }

  const options = (optionsOrAlpine as NotifyPluginOptions | undefined) ?? {};

  return (Alpine: AlpineType.Alpine) => {
    registerNotifyPlugin(Alpine, options);
  };
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $notify: NotifyMagic;
    }
  }
}
