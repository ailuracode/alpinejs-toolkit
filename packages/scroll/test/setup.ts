/**
 * Vitest setup for `@ailuracode/alpine-scroll`.
 *
 * Installs polyfills for browser APIs that happy-dom doesn't ship:
 *
 * - `Element.prototype.scrollIntoView`
 * - `window.scrollTo` / `window.scrollBy`
 * - `IntersectionObserver` (stub that records `observe` calls)
 * - `window.matchMedia` (shared helper from `test/setup/match-media.ts`)
 *
 * Each stub is intentionally observable so tests can assert against
 * recorded state.
 */

import { afterAll, beforeEach } from "vitest";
import {
  getMatchMedia,
  installWindowMatchMedia,
  resetMatchMedia,
  setMatchMedia,
} from "../../../test/setup/match-media.js";
import "../../../test/setup/singleton-cleanup.js";

export { getMatchMedia, setMatchMedia };

const { restore: restoreMatchMedia } = installWindowMatchMedia();

/* -------------------------------------------------------------------------- */
/*                              Element.scrollIntoView                        */
/* -------------------------------------------------------------------------- */

interface ScrollIntoViewRecord {
  element: Element;
  options?: ScrollToOptions | boolean;
}

const scrollIntoViewCalls: ScrollIntoViewRecord[] = [];

if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = function scrollIntoView(
    this: Element,
    options?: ScrollToOptions | boolean
  ): void {
    scrollIntoViewCalls.push({ element: this, options });
  };
}

/** Returns a snapshot of every recorded `scrollIntoView` call. */
export function getScrollIntoViewCalls(): readonly ScrollIntoViewRecord[] {
  return scrollIntoViewCalls.slice();
}

/** Resets the `scrollIntoView` call log. */
export function resetScrollIntoViewCalls(): void {
  scrollIntoViewCalls.length = 0;
}

/* -------------------------------------------------------------------------- */
/*                              window.scrollTo / scrollBy                    */
/* -------------------------------------------------------------------------- */

interface ScrollToRecord {
  options?: ScrollToOptions | number;
  left?: number;
  top?: number;
}

const scrollToCalls: ScrollToRecord[] = [];
const scrollByCalls: ScrollToRecord[] = [];

const originalScrollTo = window.scrollTo.bind(window);
const originalScrollBy = window.scrollBy.bind(window);

window.scrollTo = function scrollTo(
  this: Window,
  options?: ScrollToOptions | number,
  left?: number,
  top?: number
): void {
  scrollToCalls.push({ options, left, top });
  if (typeof options === "object" && options !== null) {
    const rect = { top: options.top ?? 0, left: options.left ?? 0 };
    if (typeof this.scrollY === "number") {
      Object.defineProperty(this, "scrollY", {
        configurable: true,
        value: rect.top,
      });
    }
    if (typeof this.scrollX === "number") {
      Object.defineProperty(this, "scrollX", {
        configurable: true,
        value: rect.left,
      });
    }
  }
} as typeof window.scrollTo;

window.scrollBy = function scrollBy(
  this: Window,
  options?: ScrollToOptions | number,
  left?: number,
  top?: number
): void {
  scrollByCalls.push({ options, left, top });
} as typeof window.scrollBy;

export function getScrollToCalls(): readonly ScrollToRecord[] {
  return scrollToCalls.slice();
}

export function getScrollByCalls(): readonly ScrollToRecord[] {
  return scrollByCalls.slice();
}

export function resetScrollCalls(): void {
  scrollToCalls.length = 0;
  scrollByCalls.length = 0;
}

/* -------------------------------------------------------------------------- */
/*                              IntersectionObserver                           */
/* -------------------------------------------------------------------------- */

interface MockIntersectionObserverEntry {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
}

interface MockIntersectionObserverInstance {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
  takeRecords(): MockIntersectionObserverEntry[];
  root: Element | null;
  rootMargin: string;
  thresholds: readonly number[];
  /** Test-only helper — fires the callback with synthetic entries. */
  __fire(entries: MockIntersectionObserverEntry[]): void;
}

const intersectionObservers: MockIntersectionObserverInstance[] = [];

class MockIntersectionObserver implements MockIntersectionObserverInstance {
  readonly root: Element | null = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly #records: MockIntersectionObserverEntry[] = [];
  readonly #observed = new Set<Element>();
  readonly #callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, init?: IntersectionObserverInit) {
    this.#callback = callback;
    this.rootMargin = init?.rootMargin ?? "0px";
    this.thresholds = init?.threshold
      ? Array.isArray(init.threshold)
        ? init.threshold
        : [init.threshold]
      : [0];
    intersectionObservers.push(this);
  }

  observe(target: Element): void {
    this.#observed.add(target);
    this.#records.push({
      target,
      isIntersecting: true,
      intersectionRatio: 1,
    });
  }

  unobserve(target: Element): void {
    this.#observed.delete(target);
  }

  disconnect(): void {
    this.#observed.clear();
  }

  takeRecords(): MockIntersectionObserverEntry[] {
    const records = this.#records.slice();
    this.#records.length = 0;
    return records;
  }

  __fire(entries: MockIntersectionObserverEntry[]): void {
    const adapted = entries.map((e) => ({
      ...e,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    })) as unknown as IntersectionObserverEntry[];
    this.#callback(adapted, this as unknown as IntersectionObserver);
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  configurable: true,
  writable: true,
  value: MockIntersectionObserver,
});

export function getIntersectionObservers(): readonly MockIntersectionObserverInstance[] {
  return intersectionObservers.slice();
}

export function resetIntersectionObservers(): void {
  intersectionObservers.length = 0;
}

/* -------------------------------------------------------------------------- */
/*                              Reset hooks                                   */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  resetMatchMedia();
  scrollIntoViewCalls.length = 0;
  scrollToCalls.length = 0;
  scrollByCalls.length = 0;
  intersectionObservers.length = 0;
  document.body.replaceChildren();
  document.body.removeAttribute("style");
  document.body.className = "";
  document.documentElement.className = "";
  document.documentElement.style.cssText = "";
});

afterAll(() => {
  restoreMatchMedia();
  window.scrollTo = originalScrollTo;
  window.scrollBy = originalScrollBy;
});

/** Cleanup — runs once after the suite. */
export function teardownScrollStubs(): void {
  restoreMatchMedia();
  window.scrollTo = originalScrollTo;
  window.scrollBy = originalScrollBy;
}
