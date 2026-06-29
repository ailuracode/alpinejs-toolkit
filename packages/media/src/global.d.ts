/// <reference types="@types/alpinejs" />

export interface MediaInterval<Name extends string = string> {
  readonly name: Name;
  readonly maxWidth: number;
}

export interface MediaPluginOptions<Name extends string = string> {
  intervals?: readonly MediaInterval<Name>[];
}

export type PrefersContrast = "no-preference" | "more" | "less" | "custom";
export type PrefersColorScheme = "light" | "dark";
export type HoverCapability = "none" | "hover";
export type PointerCapability = "none" | "coarse" | "fine";
export type Orientation = "portrait" | "landscape";

export interface MediaStore<Name extends string = string> {
  width: number;
  height: number;
  breakpoint: Name;
  readonly intervals: readonly MediaInterval<Name>[];
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  prefersReducedMotion: boolean;
  prefersContrast: PrefersContrast;
  prefersColorScheme: PrefersColorScheme;
  hover: HoverCapability;
  pointer: PointerCapability;
  orientation: Orientation;
  maxTouchPoints: number;
  readonly isTouch: boolean;
  readonly isCoarse: boolean;
  readonly isFine: boolean;
  readonly canHover: boolean;
  is(name: Name): boolean;
  refresh(): boolean;
  refreshWidth(): boolean;
  refreshHeight(): boolean;
}

export type MediaSnapshot<Name extends string = string> = {
  readonly width: number;
  readonly height: number;
  readonly breakpoint: Name;
};

export declare const DEFAULT_MEDIA_INTERVALS: readonly [
  MediaInterval<"mobile">,
  MediaInterval<"desktop">,
];

export declare const SSR_MEDIA_DEFAULTS: {
  readonly width: 0;
  readonly height: 0;
  readonly prefersReducedMotion: false;
  readonly prefersContrast: "no-preference";
  readonly prefersColorScheme: "light";
  readonly hover: "none";
  readonly pointer: "fine";
  readonly orientation: "portrait";
  readonly maxTouchPoints: 0;
};

export function mediaIntervals<const T extends readonly MediaInterval[]>(intervals: T): T;
export function resolveMediaBreakpoint<Name extends string>(
  width: number,
  intervals: readonly MediaInterval<Name>[]
): Name;
export function readMediaSnapshot<Name extends string = string>(
  intervals?: readonly MediaInterval<Name>[]
): MediaSnapshot<Name>;
export function createMediaAccessor<const Intervals extends readonly MediaInterval[]>(
  intervals: Intervals
): (alpine: import("alpinejs").Alpine) => MediaStore<Intervals[number]["name"]>;

declare global {
  namespace Alpine {
    interface Stores {
      media: MediaStore;
    }
    interface Magics<T> {
      $media: MediaStore;
    }
  }
}
