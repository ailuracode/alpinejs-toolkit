/**
 * IntersectionObserver-backed section tracker.
 *
 * The controller calls `attachSectionObserver` with the list of
 * registered sections; the helper owns the observer lifecycle and
 * reports each section flip via the supplied listener.
 *
 * SSR-safe: when `IntersectionObserver` is unavailable (Node,
 * older jsdom) the factory returns a no-op cleanup and the
 * controller degrades to "no active section" — consumers that
 * need section tracking under SSR must opt into a polyfill.
 *
 * Listener invocations go through `safeNotify()` so a misbehaving
 * subscriber cannot crash the IntersectionObserver callback.
 */

import { isBrowser, safeWindow, type Unsubscribe } from "@ailuracode/alpine-core";
import { safeNotify } from "./util";

export interface SectionObserverSection {
  readonly id: string;
  readonly element: Element;
  readonly threshold?: number | readonly number[];
  readonly rootMargin?: string;
}

export interface SectionObserverOptions {
  /** Threshold array forwarded to `IntersectionObserver`. Default: `[0]`. */
  readonly threshold?: readonly number[];
  /** `rootMargin` forwarded to `IntersectionObserver`. Default: `'0px 0px -50% 0px'`. */
  readonly rootMargin?: string;
  /**
   * Fires on every intersection flip. `visible` is the full list of
   * sections currently in the viewport (sorted by activation order).
   */
  readonly onChange?: (detail: { visible: readonly string[] }) => void;
}

/**
 * Subscribes to section-intersection events. Returns a cleanup
 * function that disconnects the observer and clears the visible
 * set.
 */
export function attachSectionObserver(
  sections: readonly SectionObserverSection[],
  options: SectionObserverOptions = {}
): Unsubscribe {
  if (!isBrowser()) {
    return () => undefined;
  }
  const win = safeWindow();
  if (!win || typeof win.IntersectionObserver === "undefined") {
    return () => undefined;
  }

  const visible = new Set<string>();
  let active = true;

  const flush = (): void => {
    if (!active) {
      return;
    }
    if (options.onChange) {
      safeNotify(options.onChange, { visible: Array.from(visible) });
    }
  };

  const observer = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as Element & { __sectionId?: string }).__sectionId;
        if (!id) {
          continue;
        }
        if (entry.isIntersecting) {
          visible.add(id);
        } else {
          visible.delete(id);
        }
      }
      flush();
    },
    {
      threshold: [...(options.threshold ?? [0])],
      rootMargin: options.rootMargin ?? "0px 0px -50% 0px",
    }
  );

  for (const section of sections) {
    (section.element as Element & { __sectionId?: string }).__sectionId = section.id;
    observer.observe(section.element);
  }

  return () => {
    if (!active) {
      return;
    }
    active = false;
    observer.disconnect();
    visible.clear();
  };
}
