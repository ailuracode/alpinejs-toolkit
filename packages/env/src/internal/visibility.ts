/**
 * Pure, framework-agnostic Page Visibility snapshot. Called from
 * `VisibilityController.mount()` and exposed for tests and SSR
 * adapters that need a single read without an event lifecycle.
 *
 * SSR-safe: when `document` is undefined the snapshot defaults to
 * `"visible"` so consumers never crash on the server.
 */

export const VISIBILITY_STATES = ["visible", "hidden", "prerender"] as const;

export type VisibilityState = (typeof VISIBILITY_STATES)[number];

export interface VisibilitySnapshot {
  readonly isVisible: boolean;
  readonly isHidden: boolean;
  readonly state: VisibilityState;
}

/**
 * Minimal document shape required to read the Page Visibility API.
 * Declared structurally so tests can inject a stub without monkey-
 * patching the real `document` global.
 */
export type VisibilitySource = Pick<Document, "hidden"> & {
  visibilityState: VisibilityState;
};

/**
 * Reads the current tab visibility from the Page Visibility API.
 * Accepts an optional `doc` to inject a stub during tests; when
 * omitted, reads from the global `document`. Returns the SSR-safe
 * "visible" default when `document` is undefined.
 *
 * @param doc - Optional `Document`-like object exposing `hidden` and `visibilityState`.
 */
export function readVisibilityState(doc?: VisibilitySource): VisibilitySnapshot {
  if (doc) {
    return {
      isVisible: !doc.hidden,
      isHidden: doc.hidden,
      state: doc.visibilityState,
    };
  }

  if (typeof document === "undefined") {
    return {
      isVisible: true,
      isHidden: false,
      state: "visible",
    };
  }

  const source = document as VisibilitySource;

  return {
    isVisible: !source.hidden,
    isHidden: source.hidden,
    state: source.visibilityState,
  };
}
