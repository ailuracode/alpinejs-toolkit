/**
 * Browser measurement adapters for virtual lists.
 *
 * All DOM access is isolated here and only runs after bind/mount.
 */

import { isBrowser } from "@ailuracode/alpine-core";

export type ScrollRect = {
  width: number;
  height: number;
};

export type ScrollTarget = HTMLElement | Window;

export function readElementRect(element: HTMLElement): ScrollRect {
  return {
    width: element.clientWidth,
    height: element.clientHeight,
  };
}

export function readWindowRect(): ScrollRect {
  if (!isBrowser()) {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function readScrollOffset(target: ScrollTarget, horizontal: boolean): number {
  if (target instanceof Window) {
    return horizontal ? target.scrollX : target.scrollY;
  }
  return horizontal ? target.scrollLeft : target.scrollTop;
}

export function writeScrollOffset(
  target: ScrollTarget,
  offset: number,
  horizontal: boolean,
  behavior: ScrollBehavior = "auto"
): void {
  if (target instanceof Window) {
    target.scrollTo({
      left: horizontal ? offset : target.scrollX,
      top: horizontal ? target.scrollY : offset,
      behavior,
    });
    return;
  }

  if (horizontal) {
    target.scrollTo({ left: offset, behavior });
  } else {
    target.scrollTo({ top: offset, behavior });
  }
}

export function attachScrollListener(target: ScrollTarget, onScroll: () => void): () => void {
  target.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    target.removeEventListener("scroll", onScroll);
  };
}

export function attachResizeObserver(
  target: HTMLElement | Window,
  onResize: (rect: ScrollRect) => void
): () => void {
  if (!isBrowser() || typeof ResizeObserver === "undefined") {
    onResize(target instanceof Window ? readWindowRect() : readElementRect(target));
    return () => {
      /* ResizeObserver unavailable — no subscription to remove */
    };
  }

  const notify = () => {
    onResize(target instanceof Window ? readWindowRect() : readElementRect(target));
  };

  if (target instanceof Window) {
    target.addEventListener("resize", notify, { passive: true });
    notify();
    return () => {
      target.removeEventListener("resize", notify);
    };
  }

  const element = target;
  const observer = new ResizeObserver(() => {
    notify();
  });
  observer.observe(element);
  notify();

  return () => {
    observer.disconnect();
  };
}
