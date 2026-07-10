/**
 * Typed event map for the toggle controller.
 *
 * The map is generic over the controller's `TA` / `TB` / `TN` so
 * every subscriber receives the typed `current` / `previous` values
 * without an `as` cast. Inherits from `BaseController`'s default
 * `Record<string, unknown>` constraint — no cast needed at the class
 * declaration.
 *
 * Per the toolkit convention (see `@ailuracode/alpine-theme`),
 * controllers expose a single `change` event with a discriminator
 * field on the detail payload instead of multiple named events. The
 * detail type itself lives in `types.ts` next to the rest of the
 * public contracts.
 */
import type { ToggleChangeDetail } from "./types";

export interface ToggleEvents<TA, TB, TN = undefined> extends Record<string, unknown> {
  change: ToggleChangeDetail<TA, TB, TN>;
}
