/**
 * Visibility manager.
 *
 * Wraps the `document.visibilitychange` event so the realtime
 * controller can pause / resume its transport when the browser tab
 * becomes hidden. The `document` is injected so the manager stays
 * SSR-safe and platform-agnostic (Node, happy-dom).
 *
 * Lifecycle:
 *
 * ```text
 *   start(onHidden, onVisible) ── registers listener
 *   stop()                      ── unregisters listener, clears state
 * ```
 *
 * @module
 */

/**
 * Minimal document contract. The only property we touch is
 * `visibilityState`, but we still need a stub for SSR environments.
 */
export interface VisibilityDocument {
  readonly visibilityState: "visible" | "hidden" | "prerender" | "unloaded";
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
}

/**
 * Default lookups the manager uses when no document is injected.
 *
 * Returning `null` lets `start()` short-circuit gracefully when the
 * runtime has no DOM (Node, server-side renderers).
 */
export interface VisibilityResolution {
  readonly getDocument: () => VisibilityDocument | null;
}

/**
 * Detects the browser tab visibility and dispatches lifecycle
 * notifications to subscribed listeners.
 *
 * Construct with the document resolution to use; pass a stub
 * `{ getDocument: () => null }` for SSR — `start()` becomes a
 * no-op in that case.
 */
export class VisibilityManager {
  readonly #resolveDocument: () => VisibilityDocument | null;
  #listener: (() => void) | null = null;
  #document: VisibilityDocument | null = null;
  #isVisible = true;
  #onHidden: (() => void) | null = null;
  #onVisible: (() => void) | null = null;

  constructor(resolution: VisibilityResolution = { getDocument: defaultGetDocument }) {
    this.#resolveDocument = resolution.getDocument;
  }

  /**
   * Begins listening to `visibilitychange`. Idempotent — calling
   * `start` twice is a no-op.
   *
   * When the document is unavailable (SSR), this is a no-op and
   * both callbacks are never invoked.
   */
  start(onHidden: () => void, onVisible: () => void): void {
    if (this.#listener !== null) {
      return;
    }

    const document = this.#resolveDocument();
    if (!document) {
      this.#isVisible = true;
      this.#onHidden = onHidden;
      this.#onVisible = onVisible;
      return;
    }

    this.#document = document;
    this.#onHidden = onHidden;
    this.#onVisible = onVisible;
    this.#isVisible =
      document.visibilityState === "visible" || document.visibilityState === "prerender";
    this.#listener = () => {
      this.#handleChange();
    };
    document.addEventListener("visibilitychange", this.#listener);
  }

  /**
   * Removes the listener and clears stored callbacks. Idempotent.
   */
  stop(): void {
    const document = this.#document;
    const listener = this.#listener;
    this.#listener = null;
    this.#document = null;
    this.#onHidden = null;
    this.#onVisible = null;
    this.#isVisible = true;

    if (document && listener) {
      document.removeEventListener("visibilitychange", listener);
    }
  }

  /** True when the document is currently visible (or when SSR / unavailable). */
  get isVisible(): boolean {
    return this.#isVisible;
  }

  /** Snapshot of the underlying document's `visibilityState`. */
  get visibilityState(): VisibilityDocument["visibilityState"] | "unknown" {
    return this.#document?.visibilityState ?? "unknown";
  }

  #handleChange(): void {
    const document = this.#document;
    if (!document) {
      return;
    }

    const nextVisible =
      document.visibilityState === "visible" || document.visibilityState === "prerender";
    const wasVisible = this.#isVisible;
    this.#isVisible = nextVisible;

    if (wasVisible === nextVisible) {
      return;
    }

    if (nextVisible) {
      this.#onVisible?.();
    } else {
      this.#onHidden?.();
    }
  }
}

function defaultGetDocument(): VisibilityDocument | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document as unknown as VisibilityDocument;
}
