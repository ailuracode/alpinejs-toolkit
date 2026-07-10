/**
 * SSR-safe portal root factory.
 *
 * Returns the existing portal container when one with the requested
 * id already exists in the DOM; otherwise creates a new element,
 * appends it to `document.body`, and returns it. Returns `null`
 * under SSR or when `document` is unavailable so the caller can
 * short-circuit consumer templates without throwing.
 *
 * The portal helper is generic on purpose — it is a DOM primitive
 * any consumer can compose. The `@ailuracode/alpine-overlay`
 * plugin uses the same shape internally to materialise the overlay
 * root, but nothing in this module depends on Alpine.
 */

import { safeDocument } from "../internal/browser.js";
import type { PortalRootOptions } from "./types.js";

const DEFAULT_ID = "overlay-root";
const DEFAULT_TAG: keyof HTMLElementTagNameMap = "div";

/**
 * Returns the portal container for `opts.id`, creating it on the
 * first call. Idempotent — repeat calls return the same element.
 *
 * @param opts - Portal configuration (id, className, tag).
 * @returns The portal container, or `null` when `document` is
 *   unavailable (SSR / Node test runners).
 */
export function createPortalRoot(opts: PortalRootOptions = {}): HTMLElement | null {
  const doc = safeDocument();
  if (!doc) {
    return null;
  }

  const id = opts.id ?? DEFAULT_ID;
  const existing = doc.getElementById(id);

  if (existing) {
    return existing;
  }

  const tag = opts.as ?? DEFAULT_TAG;
  const element = doc.createElement(tag);
  element.id = id;
  if (opts.className) {
    element.className = opts.className;
  }
  doc.body.appendChild(element);
  return element;
}
