/**
 * Framework-neutral DOM re-apply wiring for {@link ThemeManager}.
 *
 * Listens to caller-supplied document events and calls `manager.apply()`
 * when external navigation mutates `<html>` out from under the theme
 * strategy (for example Astro View Transitions re-syncing attributes).
 */

import type { ThemeManager } from "./types.js";

/** Options for {@link bindThemeReapplyEvents}. */
export interface BindThemeReapplyEventsOptions {
  /**
   * Event target that receives the listeners. Default: `document` when
   * available in the current runtime.
   */
  readonly target?: EventTarget;
}

function resolveDocument(): Document | undefined {
  if (typeof globalThis !== "undefined" && "document" in globalThis) {
    return (globalThis as { document?: Document }).document;
  }
  return undefined;
}

/**
 * Registers `manager.apply()` on each supplied event type. Returns a
 * teardown function that removes every listener symmetrically.
 *
 * When `document` / `addEventListener` is unavailable (SSR, tests), the
 * function is a no-op and returns an empty teardown.
 */
export function bindThemeReapplyEvents(
  manager: ThemeManager,
  events: readonly string[],
  options: BindThemeReapplyEventsOptions = {}
): () => void {
  if (events.length === 0) {
    return () => undefined;
  }

  const target = options.target ?? resolveDocument();
  if (!target || typeof target.addEventListener !== "function") {
    return () => undefined;
  }

  const reapply = (): void => {
    manager.apply();
  };
  const bound: Array<[string, () => void]> = [];
  for (const type of events) {
    target.addEventListener(type, reapply);
    bound.push([type, reapply]);
  }

  return (): void => {
    for (const [type, listener] of bound) {
      target.removeEventListener(type, listener);
    }
  };
}
