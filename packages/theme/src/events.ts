/**
 * Strongly-typed event map for the theme controller.
 *
 * The event map is the small surface this module owns. The payload
 * types (`ThemeChangeDetail`, `ThemeChangeSource`) and the snapshot
 * type (`ThemeState`) all live in `./types.ts` so the manager
 * interface in that module can reference them without creating an
 * `events.ts ↔ types.ts` import cycle.
 */

import type { ThemeChangeDetail } from './types';

/**
 * Event map consumed by `BaseController<ThemeEvents>`. Single-key
 * contract: every transition emits `change` with the same
 * {@link ThemeChangeDetail} payload.
 */
export interface ThemeEvents extends Record<string, unknown> {
    change: ThemeChangeDetail;
}

/**
 * Subscriber callback for the `change` event. Hardcoded to the
 * listener signature `(detail: ThemeChangeDetail) => void` rather
 * than indexed via `ThemeEvents['change']` because that indexer
 * returns the *payload* type, not the *callback* type. Keeping it
 * explicit avoids the silent payload-vs-callback swap.
 */
export type ThemeListener = (detail: ThemeChangeDetail) => void;