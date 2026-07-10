/**
 * Strongly-typed event map for the toast controller.
 *
 * Per the toolkit convention (see `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-lang`), the event map is the small surface
 * this module owns; the detail types live in `./types.ts` so the
 * manager interface in that module can reference them without an
 * `events.ts ↔ types.ts` import cycle.
 *
 * The controller emits a single `change` event after every state
 * mutation (push, update, dismiss, dismissAt, dismissAll,
 * pushUnique). The Alpine adapter subscribes to this one event and
 * mirrors the `items` snapshot into the reactive store proxy.
 *
 * `source` discriminates the kind of transition so subscribers can
 * branch on intent (e.g. animations might react differently to
 * `push` vs `dismiss`).
 *
 * The event map is parameterized by `TPositions` and `TContent` so
 * `BaseController.emit` infers the right `ToastChangeDetail` shape
 * for each generic instantiation of the controller.
 */

import type { ToastChangeDetail } from "./types";

/**
 * Event map consumed by `BaseController<ToastEvents>`. Single-key
 * contract: every transition emits `change` with the same
 * {@link ToastChangeDetail} payload.
 */
export interface ToastEvents<TPositions extends readonly string[] = readonly [], TContent = unknown>
  extends Record<string, unknown> {
  change: ToastChangeDetail<readonly [], TPositions, TContent>;
}

/**
 * Subscriber callback for the `change` event. Hardcoded to the
 * listener signature `(detail: ToastChangeDetail) => void` rather
 * than indexed via `ToastEvents['change']` because that indexer
 * returns the *payload* type, not the *callback* type. Keeping it
 * explicit avoids the silent payload-vs-callback swap.
 */
export type ToastListener<
  TPositions extends readonly string[] = readonly [],
  TContent = unknown,
> = (detail: ToastChangeDetail<readonly [], TPositions, TContent>) => void;
