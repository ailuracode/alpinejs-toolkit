/**
 * SSR-safe portal root resolver.
 *
 * Pure function (no module-level `window` / `document` import —
 * the `Document` is injected). The controller calls this during
 * `configure()` with the result of a `typeof document` check; the
 * function itself never reaches for a global.
 *
 * Behavior:
 * - `null` doc (SSR) → returns `null`.
 * - `HTMLElement` input → returns it unchanged.
 * - String selector → returns the matching element, OR creates a
 *   `<div id="<selector>">` and appends it to `doc.body`.
 */

export interface PortalResolveOptions {
  /**
   * Override the default tag. Defaults to `"div"`. Used when the
   * consumer wants a semantic element (`<aside>`, `<section>`).
   */
  readonly tag?: keyof HTMLElementTagNameMap;
  /** Optional class list applied when creating a new element. */
  readonly className?: string;
}

/**
 * Resolves `rootOrSelector` against `doc`:
 * - `null` doc → returns `null`.
 * - `HTMLElement` → returned as-is.
 * - String → `doc.getElementById(...)` first; on miss, creates a
 *   new `<{tag} id="{selector}">` and appends to `doc.body`.
 */
export function resolveOrCreatePortalRoot(
  rootOrSelector: HTMLElement | string | null,
  doc: Document | null,
  options: PortalResolveOptions = {}
): HTMLElement | null {
  if (!doc) {
    return null;
  }

  if (rootOrSelector instanceof HTMLElement) {
    return rootOrSelector;
  }

  if (typeof rootOrSelector === "string" && rootOrSelector.length > 0) {
    const id = rootOrSelector.startsWith("#") ? rootOrSelector.slice(1) : rootOrSelector;
    const existing = doc.getElementById(id);
    if (existing) {
      return existing;
    }
    const tag = options.tag ?? "div";
    const element = doc.createElement(tag);
    element.id = id;
    if (options.className) {
      element.className = options.className;
    }
    doc.body.appendChild(element);
    return element;
  }

  // No selector / element supplied — lazy-create with the
  // conventional overlay-root id so the controller can be used
  // without an explicit `configure()` call.
  const id = "overlay-root";
  const existing = doc.getElementById(id);
  if (existing) {
    return existing;
  }
  const element = doc.createElement("div");
  element.id = id;
  doc.body.appendChild(element);
  return element;
}

/**
 * Returns `document` if available, `null` under SSR. Mirrors the
 * `safeDocument()` helper planned for `@ailuracode/alpine-core` —
 * inlined here so the overlay package does not have a runtime
 * dependency on a primitive that core has not exported yet.
 */
export function safeDocument(): Document | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document;
}
