/// <reference types="astro/client" />
/// <reference types="@types/alpinejs" />

// ── Type imports for Alpine augmentation ──────────────────────────────
type ThemeStore = import("@ailuracode/alpinejs-theme").ThemeStore;
type ScreenStore = import("@ailuracode/alpinejs-screen").ScreenStore;
type ScrollStore = import("@ailuracode/alpinejs-scroll").ScrollStore;
type SidebarStore = import("@ailuracode/alpinejs-sidebar").SidebarStore;
type GeoStore = import("@ailuracode/alpinejs-geo").GeoStore;
type QueryStore = import("@ailuracode/alpinejs-query").QueryStore;
type ToastStore = import("@ailuracode/alpinejs-toast").ToastStore<
  typeof import("./entrypoint").toastDemoVariants,
  typeof import("./entrypoint").toastDemoPositions,
  import("./entrypoint").ToastDemoContent
>;
type NetworkMagic = import("@ailuracode/alpinejs-network").NetworkMagic;
type VisibilityMagic = import("@ailuracode/alpinejs-visibility").VisibilityMagic;
type BatteryMagic = import("@ailuracode/alpinejs-battery").BatteryMagic;
type ClipboardMagic = import("@ailuracode/alpinejs-clipboard").ClipboardMagic;
type ToastMagic = import("@ailuracode/alpinejs-toast").ToastMagic<
  typeof import("./entrypoint").toastDemoVariants,
  typeof import("./entrypoint").toastDemoPositions,
  import("./entrypoint").ToastDemoContent
>;
type ExportMagic = import("@ailuracode/alpinejs-export").ExportMagic;
type CalendarMagic = import("@ailuracode/alpinejs-calendar").CalendarMagic;
type TouchMagic = import("@ailuracode/alpinejs-touch").TouchMagic;
type ToggleMagic = import("@ailuracode/alpinejs-toggle").ToggleMagic;
type PlatformMagic = import("@ailuracode/alpinejs-platform").PlatformMagic;
type NotifyMagic = import("@ailuracode/alpinejs-notify").NotifyMagic;
type ShareMagic = import("@ailuracode/alpinejs-share").ShareMagic;
type WakeLockMagic = import("@ailuracode/alpinejs-attention").WakeLockMagic;
type IdleMagic = import("@ailuracode/alpinejs-attention").IdleMagic;
type JsonApiMagic = import("@ailuracode/alpinejs-json-api").JsonApiClient;

declare module "alpinejs" {
  namespace Alpine {
    interface Stores {
      theme: ThemeStore;
      device: ScreenStore;
      scroll: ScrollStore;
      sidebar: SidebarStore;
      geo: GeoStore;
      query: QueryStore;
      toast: ToastStore;
    }
    interface Magics<T> {
      $theme: ThemeStore;
      $device: ScreenStore;
      $scroll: ScrollStore;
      $sidebar: SidebarStore;
      $geo: GeoStore;
      $network: NetworkMagic;
      $visibility: VisibilityMagic;
      $battery: BatteryMagic;
      $clipboard: ClipboardMagic;
      $toast: ToastMagic;
      $export: ExportMagic;
      $calendar: CalendarMagic;
      $touch: TouchMagic;
      $toggle: ToggleMagic;
      $platform: PlatformMagic;
      $notify: NotifyMagic;
      $share: ShareMagic;
      $wakelock: WakeLockMagic;
      $idle: IdleMagic;
      $jsonapi: JsonApiMagic;
    }
  }
}

import type { AlpineInstance } from "./types/alpine";

declare global {
  var Alpine: AlpineInstance;
}
