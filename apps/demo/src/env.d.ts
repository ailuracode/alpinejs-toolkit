/// <reference types="astro/client" />
/// <reference types="@types/alpinejs" />

// ── Type imports for Alpine augmentation ──────────────────────────────
type ThemeStore = import("@ailuracode/alpine-theme").ThemeStore;
type MediaStore = import("@ailuracode/alpine-media").MediaStore;
type ScrollStore = import("@ailuracode/alpine-scroll").ScrollStore;
type SidebarStore = import("@ailuracode/alpine-sidebar").SidebarStore;
type GeoStore = import("@ailuracode/alpine-geo").GeoStore;
type QueryStore = import("@ailuracode/alpine-query").QueryStore;
type ToastStore = import("@ailuracode/alpine-toast").ToastStore<
  typeof import("./entrypoint").toastDemoVariants,
  typeof import("./entrypoint").toastDemoPositions,
  import("./entrypoint").ToastDemoContent
>;
type NetworkMagic = import("@ailuracode/alpine-env").NetworkMagic;
type VisibilityMagic = import("@ailuracode/alpine-env").VisibilityMagic;
type BatteryMagic = import("@ailuracode/alpine-env").BatteryMagic;
type ClipboardMagic = import("@ailuracode/alpine-transfer").ClipboardMagic;
type ToastMagic = import("@ailuracode/alpine-toast").ToastMagic<
  typeof import("./entrypoint").toastDemoVariants,
  typeof import("./entrypoint").toastDemoPositions,
  import("./entrypoint").ToastDemoContent
>;
type ExportMagic = import("@ailuracode/alpine-transfer").ExportMagic;
type CalendarMagic = import("@ailuracode/alpine-calendar").CalendarMagic;
type ToggleMagic = import("@ailuracode/alpine-toggle").ToggleMagic;
type PlatformMagic = import("@ailuracode/alpine-env").PlatformMagic;
type NotifyMagic = import("@ailuracode/alpine-notify").NotifyMagic;
type ShareMagic = import("@ailuracode/alpine-transfer").ShareMagic;
type WakeLockMagic = import("@ailuracode/alpine-attention").WakeLockMagic;
type IdleMagic = import("@ailuracode/alpine-attention").IdleMagic;
type JsonApiMagic = import("@ailuracode/alpine-json-api").JsonApiClient;

declare module "alpinejs" {
  interface Alpine {
    $persist<T>(value: T): {
      as(key: string): T;
      using(storage: Storage): { as(key: string): T };
    };
  }

  namespace Alpine {
    interface Stores {
      theme: ThemeStore;
      media: MediaStore;
      scroll: ScrollStore;
      sidebar: SidebarStore;
      geo: GeoStore;
      query: QueryStore;
      toast: ToastStore;
    }
    interface Magics<T> {
      $theme: ThemeStore;
      $media: MediaStore;
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
