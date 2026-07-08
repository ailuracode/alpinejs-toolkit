/**
 * Strongly-typed event map for the lang controller.
 *
 * The event map is the small surface this module owns. The payload
 * type (`LangChangeDetail`) and the snapshot type (`LangState`) both
 * live in `./types.ts` so the manager interface in that module can
 * reference them without creating an `events.ts ↔ types.ts` import
 * cycle (same pattern as `@ailuracode/alpine-theme`).
 */

import type { LangChangeDetail } from "./types";

/**
 * Event map consumed by `BaseController<LangEvents>`. Single-key
 * contract: every transition emits `change` with the same
 * {@link LangChangeDetail} payload.
 */
export interface LangEvents extends Record<string, unknown> {
  change: LangChangeDetail;
}

/**
 * Subscriber callback for the `change` event. Hardcoded to the
 * listener signature `(detail: LangChangeDetail) => void` rather
 * than indexed via `LangEvents['change']` because that indexer
 * returns the *payload* type, not the *callback* type. Keeping it
 * explicit avoids the silent payload-vs-callback swap.
 */
export type LangListener = (detail: LangChangeDetail) => void;
