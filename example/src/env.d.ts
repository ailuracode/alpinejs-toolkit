/// <reference types="astro/client" />
/// <reference types="@types/alpinejs" />

// ── Type imports for Alpine augmentation ──────────────────────────────
type ThemeStore = import("@ailuracode/alpine-theme").ThemeStore;
type ScreenStore = import("@ailuracode/alpine-screen").ScreenStore;
type ScrollStore = import("@ailuracode/alpine-scroll").ScrollStore;
type SidebarStore = import("@ailuracode/alpine-sidebar").SidebarStore;
type GeoStore = import("@ailuracode/alpine-geo").GeoStore;
type QueryStore = import("@ailuracode/alpine-query").QueryStore;
type ToastStore = import("@ailuracode/alpine-toast").ToastStore<
  typeof import("./entrypoint").toastDemoVariants,
  typeof import("./entrypoint").toastDemoPositions,
  import("./entrypoint").ToastDemoContent
>;
type NetworkMagic = import("@ailuracode/alpine-network").NetworkMagic;
type VisibilityMagic = import("@ailuracode/alpine-visibility").VisibilityMagic;
type BatteryMagic = import("@ailuracode/alpine-battery").BatteryMagic;
type ClipboardMagic = import("@ailuracode/alpine-clipboard").ClipboardMagic;
type ToastMagic = import("@ailuracode/alpine-toast").ToastMagic<
  typeof import("./entrypoint").toastDemoVariants,
  typeof import("./entrypoint").toastDemoPositions,
  import("./entrypoint").ToastDemoContent
>;
type ExportMagic = import("@ailuracode/alpine-export").ExportMagic;
type CalendarMagic = import("@ailuracode/alpine-calendar").CalendarMagic;
type TouchMagic = import("@ailuracode/alpine-touch").TouchMagic;
type ToggleMagic = import("@ailuracode/alpine-toggle").ToggleMagic;
type PlatformMagic = import("@ailuracode/alpine-platform").PlatformMagic;
type NotifyMagic = import("@ailuracode/alpine-notify").NotifyMagic;
type ShareMagic = import("@ailuracode/alpine-share").ShareMagic;
type WakeLockMagic = import("@ailuracode/alpine-attention").WakeLockMagic;
type IdleMagic = import("@ailuracode/alpine-attention").IdleMagic;
type JsonApiMagic = import("@ailuracode/alpine-json-api").JsonApiClient;

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

import { Alpine as AlpineType } from "alpinejs";

declare global {
  var Alpine: AlpineType;
}
