import type AlpineType from "alpinejs";

export type ScrollDirection = "up" | "down" | "none";

export interface ScrollSnapshot {
  x: number;
  y: number;
  direction: ScrollDirection;
  atTop: boolean;
  atBottom: boolean;
  progress: number;
}

export interface ScrollStore extends ScrollSnapshot {
  locked: boolean;
  refresh(): boolean;
  lock(): boolean;
  unlock(): boolean;
  toggleLock(): boolean;
  readonly isLocked: boolean;
  readonly isAtTop: boolean;
  readonly isAtBottom: boolean;
  readonly isScrollingDown: boolean;
  readonly isScrollingUp: boolean;
  readonly showToTop: boolean;
  toTop(behavior?: ScrollBehavior): void;
  toBottom(behavior?: ScrollBehavior): void;
}

let savedScrollY = 0;
let lockCount = 0;

function readScrollState(previousY: number): ScrollSnapshot {
  const x = window.scrollX;
  const y = window.scrollY;
  const maxY = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

  return {
    x,
    y,
    direction: y > previousY ? "down" : y < previousY ? "up" : "none",
    atTop: y <= 0,
    atBottom: y >= maxY - 1,
    progress: maxY > 0 ? Math.round((y / maxY) * 100) : 0,
  };
}

function applyLock(): void {
  savedScrollY = window.scrollY;
  document.documentElement.classList.add("scroll-locked");
  document.body.classList.add("scroll-locked");
  document.body.style.top = `-${savedScrollY}px`;
}

function removeLock(): void {
  document.documentElement.classList.remove("scroll-locked");
  document.body.classList.remove("scroll-locked");
  document.body.style.top = "";
  window.scrollTo(0, savedScrollY);
}

/** Alpine.js scroll plugin. Registers `$store.scroll`. */
export default function scrollPlugin(Alpine: AlpineType.Alpine): void {
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

    lock() {
      if (lockCount === 0) {
        applyLock();
        this.locked = true;
      }

      lockCount++;
      return this.locked;
    },

    unlock() {
      if (lockCount === 0) {
        return this.locked;
      }

      lockCount--;

      if (lockCount === 0) {
        removeLock();
        this.locked = false;
        this.refresh();
      }

      return this.locked;
    },

    toggleLock() {
      return this.locked ? this.unlock() : this.lock();
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
  let ticking = false;

  function scheduleRefresh() {
    if (ticking || scrollStore.locked) {
      return;
    }
    ticking = true;
    requestAnimationFrame(() => {
      scrollStore.refresh();
      ticking = false;
    });
  }

  scrollStore.refresh();
  window.addEventListener("scroll", scheduleRefresh, { passive: true });
  window.addEventListener("resize", scheduleRefresh, { passive: true });
}

declare global {
  namespace Alpine {
    interface Stores {
      scroll: ScrollStore;
    }
  }
}
