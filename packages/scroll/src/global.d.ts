/// <reference types="@types/alpinejs" />

export declare const SCROLL_DIRECTIONS: readonly ["up", "down", "none"];

export type ScrollDirection = (typeof SCROLL_DIRECTIONS)[number];

export declare const SCROLL_BEHAVIORS: readonly ["auto", "instant", "smooth"];

export type ScrollBehaviorOption = (typeof SCROLL_BEHAVIORS)[number];

export declare const SCROLL_LOCK_AXES: readonly ["y", "both"];

export type ScrollLockAxis = (typeof SCROLL_LOCK_AXES)[number];

export type ScrollLockOptions = {
  axis?: ScrollLockAxis;
};

export type ScrollSnapshot = {
  readonly x: number;
  readonly y: number;
  readonly direction: ScrollDirection;
  readonly atTop: boolean;
  readonly atBottom: boolean;
  readonly progress: number;
};

export interface ScrollStore extends ScrollSnapshot {
  locked: boolean;
  refresh(): boolean;
  lock(options?: ScrollLockOptions): boolean;
  unlock(): boolean;
  toggleLock(options?: ScrollLockOptions): boolean;
  isDirection(direction: ScrollDirection): boolean;
  readonly isLocked: boolean;
  readonly isAtTop: boolean;
  readonly isAtBottom: boolean;
  readonly isScrollingDown: boolean;
  readonly isScrollingUp: boolean;
  readonly showToTop: boolean;
  toTop(behavior?: ScrollBehavior): void;
  toBottom(behavior?: ScrollBehavior): void;
}

export interface ScrollPluginOptions {
  onLockChange?: (locked: boolean) => void;
}

export type ScrollMetricsInput = {
  x: number;
  y: number;
  previousY: number;
  scrollHeight: number;
  innerHeight: number;
};

export function scrollOptions<const T extends ScrollPluginOptions>(options: T): T;
export function computeScrollDirection(previousY: number, currentY: number): ScrollDirection;
export function computeScrollMetrics(input: ScrollMetricsInput): ScrollSnapshot;
export function readScrollSnapshot(previousY?: number): ScrollSnapshot;

export default function scrollPlugin(
  options?: ScrollPluginOptions
): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      scroll: ScrollStore;
    }
    interface Magics<T> {
      $scroll: ScrollStore;
    }
  }
}
