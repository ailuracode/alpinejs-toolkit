import type AlpineType from "alpinejs";

export const SCROLL_DIRECTIONS = ["up", "down", "none"] as const;

export type ScrollDirection = (typeof SCROLL_DIRECTIONS)[number];

export const SCROLL_BEHAVIORS = ["auto", "instant", "smooth"] as const;

export type ScrollBehaviorOption = (typeof SCROLL_BEHAVIORS)[number];

export const SCROLL_LOCK_AXES = ["y", "both"] as const;

export type ScrollLockAxis = (typeof SCROLL_LOCK_AXES)[number];

export type ScrollLockOptions = {
  /** `y` (default) locks vertical page scroll; `both` also freezes horizontal scroll. */
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
  /** Called when scroll lock is applied or fully released. Use for custom classes or attributes. */
  onLockChange?: (locked: boolean) => void;
}

export type ScrollMetricsInput = {
  x: number;
  y: number;
  previousY: number;
  scrollHeight: number;
  innerHeight: number;
};

type ScrollLockStyleSnapshot = {
  htmlOverflow: string;
  htmlOverflowY: string;
  htmlOverflowX: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyOverflow: string;
  bodyOverflowY: string;
  bodyOverflowX: string;
  bodyOverscrollBehavior: string;
  bodyOverscrollBehaviorY: string;
};

function snapshotScrollLockStyles(): ScrollLockStyleSnapshot {
  const html = document.documentElement;
  const body = document.body;

  return {
    htmlOverflow: html.style.overflow,
    htmlOverflowY: html.style.overflowY,
    htmlOverflowX: html.style.overflowX,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    bodyOverflow: body.style.overflow,
    bodyOverflowY: body.style.overflowY,
    bodyOverflowX: body.style.overflowX,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    bodyOverscrollBehaviorY: body.style.overscrollBehaviorY,
  };
}

/** Builds typed scroll plugin options. */
export function scrollOptions<const T extends ScrollPluginOptions>(options: T): T {
  return options;
}

/** Resolves scroll direction from previous and current vertical offsets. */
export function computeScrollDirection(previousY: number, currentY: number): ScrollDirection {
  if (currentY > previousY) {
    return "down";
  }

  if (currentY < previousY) {
    return "up";
  }

  return "none";
}

/** Computes scroll metrics from viewport values (pure, testable). */
export function computeScrollMetrics(input: ScrollMetricsInput): ScrollSnapshot {
  const maxY = Math.max(input.scrollHeight - input.innerHeight, 0);

  return {
    x: input.x,
    y: input.y,
    direction: computeScrollDirection(input.previousY, input.y),
    atTop: input.y <= 0,
    atBottom: input.y >= maxY - 1,
    progress: maxY > 0 ? Math.round((input.y / maxY) * 100) : 0,
  };
}

/** Reads the current scroll snapshot from the viewport. */
export function readScrollSnapshot(
  previousY = typeof window !== "undefined" ? window.scrollY : 0
): ScrollSnapshot {
  if (typeof window === "undefined") {
    return computeScrollMetrics({
      x: 0,
      y: 0,
      previousY,
      scrollHeight: 0,
      innerHeight: 0,
    });
  }

  return computeScrollMetrics({
    x: window.scrollX,
    y: window.scrollY,
    previousY,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  });
}

function readScrollState(previousY: number): ScrollSnapshot {
  return readScrollSnapshot(previousY);
}

function applyVerticalScrollLockStyles(): ScrollLockStyleSnapshot {
  const snapshot = snapshotScrollLockStyles();
  const html = document.documentElement;
  const body = document.body;

  html.style.overflowY = "hidden";
  body.style.overflowY = "hidden";
  body.style.overscrollBehaviorY = "none";

  return snapshot;
}

function applyBothAxisScrollLockStyles(scrollY: number, scrollX: number): ScrollLockStyleSnapshot {
  const snapshot = snapshotScrollLockStyles();
  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = scrollX > 0 ? `-${scrollX}px` : "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";

  return snapshot;
}

function restoreScrollLockStyles(snapshot: ScrollLockStyleSnapshot): void {
  const html = document.documentElement;
  const body = document.body;

  html.style.overflow = snapshot.htmlOverflow;
  html.style.overflowY = snapshot.htmlOverflowY;
  html.style.overflowX = snapshot.htmlOverflowX;
  body.style.position = snapshot.bodyPosition;
  body.style.top = snapshot.bodyTop;
  body.style.left = snapshot.bodyLeft;
  body.style.right = snapshot.bodyRight;
  body.style.width = snapshot.bodyWidth;
  body.style.overflow = snapshot.bodyOverflow;
  body.style.overflowY = snapshot.bodyOverflowY;
  body.style.overflowX = snapshot.bodyOverflowX;
  body.style.overscrollBehavior = snapshot.bodyOverscrollBehavior;
  body.style.overscrollBehaviorY = snapshot.bodyOverscrollBehaviorY;
}

function effectiveLockAxis(lockStack: ScrollLockAxis[]): ScrollLockAxis {
  return lockStack.includes("both") ? "both" : "y";
}

/** Alpine.js scroll plugin. Registers `$store.scroll`. */
export default function scrollPlugin(options: ScrollPluginOptions = {}): AlpineType.PluginCallback {
  return function registerScroll(Alpine) {
    let savedScrollY = 0;
    let savedScrollX = 0;
    const lockStack: ScrollLockAxis[] = [];
    let lockStyles: ScrollLockStyleSnapshot | null = null;
    let appliedAxis: ScrollLockAxis | null = null;

    function clearLockStyles(): void {
      if (!lockStyles) {
        return;
      }

      restoreScrollLockStyles(lockStyles);
      lockStyles = null;
    }

    function applyLockStyles(axis: ScrollLockAxis): void {
      lockStyles =
        axis === "both"
          ? applyBothAxisScrollLockStyles(savedScrollY, savedScrollX)
          : applyVerticalScrollLockStyles();
      appliedAxis = axis;
    }

    function captureScrollPosition(): void {
      savedScrollY = window.scrollY;
      savedScrollX = window.scrollX;
    }

    function restoreScrollPosition(axis: ScrollLockAxis): void {
      const left = axis === "both" ? savedScrollX : window.scrollX;
      window.scrollTo({ top: savedScrollY, left, behavior: "instant" });
    }

    function applyLock(axis: ScrollLockAxis): void {
      captureScrollPosition();
      applyLockStyles(axis);
      options.onLockChange?.(true);
    }

    function syncLockStyles(): void {
      const nextAxis = effectiveLockAxis(lockStack);

      if (nextAxis === appliedAxis) {
        return;
      }

      clearLockStyles();

      if (appliedAxis === "both") {
        restoreScrollPosition("both");
      }

      captureScrollPosition();
      applyLockStyles(nextAxis);
    }

    function removeLock(): void {
      const axis = appliedAxis ?? "y";

      clearLockStyles();
      restoreScrollPosition(axis);
      appliedAxis = null;
      options.onLockChange?.(false);
    }

    const scrollStore: ScrollStore = {
      x: 0,
      y: 0,
      direction: "none",
      atTop: true,
      atBottom: false,
      progress: 0,
      locked: false,

      refresh() {
        const next = readScrollState(this.y);
        const unchanged =
          this.x === next.x &&
          this.y === next.y &&
          this.direction === next.direction &&
          this.atTop === next.atTop &&
          this.atBottom === next.atBottom &&
          this.progress === next.progress;

        if (unchanged) {
          return false;
        }

        Object.assign(this, next);
        return true;
      },

      lock(options: ScrollLockOptions = {}) {
        const axis = options.axis ?? "y";

        if (lockStack.length === 0) {
          applyLock(axis);
          this.locked = true;
          lockStack.push(axis);
          return this.locked;
        }

        lockStack.push(axis);
        syncLockStyles();
        return this.locked;
      },

      unlock() {
        if (lockStack.length === 0) {
          return this.locked;
        }

        lockStack.pop();

        if (lockStack.length === 0) {
          removeLock();
          this.locked = false;
          this.refresh();
        } else {
          syncLockStyles();
        }

        return this.locked;
      },

      toggleLock(options: ScrollLockOptions = {}) {
        if (this.locked) {
          return this.unlock();
        }

        return this.lock(options);
      },

      isDirection(direction: ScrollDirection) {
        return this.direction === direction;
      },

      get isLocked() {
        return this.locked;
      },

      get isAtTop() {
        return this.atTop;
      },

      get isAtBottom() {
        return this.atBottom;
      },

      get isScrollingDown() {
        return this.direction === "down";
      },

      get isScrollingUp() {
        return this.direction === "up";
      },

      get showToTop() {
        return !(this.atTop || this.locked);
      },

      toTop(behavior: ScrollBehavior = "smooth") {
        if (this.locked) {
          return;
        }
        window.scrollTo({ top: 0, behavior });
      },

      toBottom(behavior: ScrollBehavior = "smooth") {
        if (this.locked) {
          return;
        }
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior,
        });
      },
    };

    Alpine.store("scroll", scrollStore);
    Alpine.magic("scroll", () => Alpine.store("scroll"));
    const store = Alpine.store("scroll") as ScrollStore;
    let ticking = false;

    function scheduleRefresh() {
      if (ticking || store.locked) {
        return;
      }
      ticking = true;
      requestAnimationFrame(() => {
        store.refresh();
        ticking = false;
      });
    }

    store.refresh();
    window.addEventListener("scroll", scheduleRefresh, { passive: true });
    window.addEventListener("resize", scheduleRefresh, { passive: true });
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      scroll: ScrollStore;
    }
  }
}
