/**
 * Alpine magic factory for `@ailuracode/alpine-overlay`.
 *
 * `Alpine.magic('overlay', factory)` registers a property the
 * reactive scope reads as `$overlay`. The factory runs every time
 * a template evaluates `$overlay`, so we re-fetch the reactive
 * proxy from Alpine on each call instead of capturing it at
 * registration time — this keeps tests that re-install Alpine
 * working and matches the reactive-bridge strategy documented in
 * design §3 (ADR-5: same reference, re-fetched lazily).
 */

import type { OverlayAlpine, OverlayMagicFacade } from "../types.js";

/**
 * Returns the closure that Alpine installs as the `$overlay`
 * magic factory. The returned function reads `Alpine.store('overlay')`
 * and casts it to {@link OverlayMagicFacade} — the public surface
 * the controller exposes through the reactive proxy.
 */
export function createOverlayMagic(alpine: OverlayAlpine): () => OverlayMagicFacade {
  return () => alpine.store("overlay") as unknown as OverlayMagicFacade;
}
