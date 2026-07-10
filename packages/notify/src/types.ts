/**
 * Public type contracts for `@ailuracode/alpine-notify`.
 */

/** Options accepted by the notify plugin factory. */
export interface NotifyPluginOptions {
  /** URL of the minimal service worker script (must be same-origin). */
  serviceWorkerUrl?: string;
  /** Register the service worker when the plugin loads. Default: true when `serviceWorkerUrl` is set. */
  autoRegisterServiceWorker?: boolean;
}

/** Alpine-facing `$notify` magic surface. */
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

/** Internal resolved configuration. */
export type NotifyConfig = {
  serviceWorkerUrl?: string;
  autoRegisterServiceWorker: boolean;
};
