/// <reference types="@types/alpinejs" />

export interface NotifyMagic {
  isSupported(): boolean;
  permission(): NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  send(title: string, options?: NotificationOptions): Notification | null;
  sendIfPermitted(title: string, options?: NotificationOptions): Notification | null;
  close(notification: Notification): void;
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $notify: NotifyMagic;
    }
  }
}
