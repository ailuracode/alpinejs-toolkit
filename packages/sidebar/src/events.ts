/**
 * Strongly-typed event map for the sidebar controller.
 *
 * The map is the small surface this module owns. The payload type
 * (`SidebarChangeDetail`) lives in `./types.ts` so the manager
 * interface in that module can reference it without creating an
 * `events.ts ↔ types.ts` import cycle.
 *
 * Per the toolkit convention (see `@ailuracode/alpine-theme`),
 * controllers expose a single `change` event with a discriminator
 * field on the detail payload instead of multiple named events.
 */
import type { SidebarChangeDetail } from "./types";

/**
 * Event map consumed by `BaseController<SidebarEvents>`. Single-key
 * contract: every transition emits `change` with the same
 * {@link SidebarChangeDetail} payload.
 */
export interface SidebarEvents extends Record<string, unknown> {
  change: SidebarChangeDetail;
}

/**
 * Subscriber callback for the `change` event. Hardcoded to the
 * listener signature `(detail: SidebarChangeDetail) => void` rather
 * than indexed via `SidebarEvents['change']` because that indexer
 * returns the *payload* type, not the *callback* type. Keeping it
 * explicit avoids the silent payload-vs-callback swap.
 */
export type SidebarListener = (detail: SidebarChangeDetail) => void;