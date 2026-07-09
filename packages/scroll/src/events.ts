/**
 * Strongly-typed event map for the scroll controller.
 *
 * Per the toolkit convention (see `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-sidebar`), the event map is the small surface
 * this module owns; the detail types live in `./types.ts` so the
 * manager interface in that module can reference them without an
 * import cycle.
 *
 * v1.0.0 event names:
 *
 * - `'change'` — full state diff, single source of truth for
 *   `$store.scroll` reactivity.
 * - `'lock'` — handle-aware lock transitions; `detail.reason`
 *   reflects the caller's intent (NOT `'lock-change'` from v0.x).
 * - `'section'` — section observer flips.
 * - `'scroll'` — raw position change (rAF-batched).
 * - `'reach'` — viewport-edge transitions (top / bottom).
 * - `'navigation'` — programmatic scroll commands.
 *
 * v0.x used `'lock-change'` as the event name. The v1.0.0 contract
 * renames it to `'lock'`. See `.changeset/scroll-migration.md` for
 * the migration notes.
 */
import type {
  ScrollChangeDetail,
  ScrollLockChangeDetail,
  ScrollLockDetail,
  ScrollNavigationDetail,
  ScrollPositionDetail,
  ScrollReachDetail,
  ScrollSectionChangeDetail,
} from "./types";

/**
 * Event map consumed by `BaseController<ScrollEvents>`. Each key is
 * an event name; each value is the payload type the event handler
 * receives.
 */
export interface ScrollEvents extends Record<string, unknown> {
  change: ScrollChangeDetail;
  lock: ScrollLockChangeDetail;
  section: ScrollSectionChangeDetail;
  scroll: ScrollPositionDetail;
  reach: ScrollReachDetail;
  navigation: ScrollNavigationDetail;
}

/**
 * Subscriber callback shape per event. Each alias hardcodes the
 * listener signature `(detail: Detail) => void` rather than indexing
 * through `ScrollEvents[name]` because that indexer returns the
 * *payload* type, not the *callback* type.
 */
export type ScrollChangeListener = (detail: ScrollChangeDetail) => void;
export type ScrollLockListener = (detail: ScrollLockChangeDetail) => void;
export type ScrollSectionListener = (detail: ScrollSectionChangeDetail) => void;
export type ScrollPositionListener = (detail: ScrollPositionDetail) => void;
export type ScrollReachListener = (detail: ScrollReachDetail) => void;
export type ScrollNavigationListener = (detail: ScrollNavigationDetail) => void;

/**
 * Re-exported at this layer so consumers that subscribe via
 * `ScrollController.on('lock', listener)` get the same `detail` shape
 * under both the canonical name and the deprecated v0.x alias.
 */
export type { ScrollLockChangeDetail, ScrollLockDetail };
