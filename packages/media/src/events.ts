/**
 * Typed event map for the media controller.
 *
 * The payload types (`MediaChangeDetail`, `MediaChangeSource`) and the
 * snapshot type (`MediaSnapshot`) all live in `./types.ts` so the
 * {@link MediaManager} interface in that module can reference them
 * without creating an `events.ts ↔ types.ts` import cycle.
 *
 * Single-key contract: every viewport transition emits `change` with
 * the same {@link MediaChangeDetail} payload. The structure mirrors
 * `theme`'s event surface — a single event with a discriminator field
 * instead of multiple named events.
 */
import type { MediaChangeDetail } from "./types";

/**
 * Event map consumed by `BaseController<MediaEvents>`. The map is
 * generic over the `Name` literal-union so every subscriber receives
 * the typed `breakpoint` field without a cast.
 *
 * Inherits from `BaseController`'s default `Record<string, unknown>`
 * constraint — no cast needed at the class declaration.
 */
export interface MediaEvents<Name extends string = string> extends Record<string, unknown> {
  change: MediaChangeDetail<Name>;
}
