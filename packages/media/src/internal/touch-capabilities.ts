/**
 * Touch / pointer capability snapshot shape used by
 * `@ailuracode/alpine-media`. Lives under `internal/` because the
 * data is only consumed inside the media controller. The reader lives
 * in `internal/queries.ts` (`readTouchSnapshot`) so the cached
 * `MediaQueryList` references flow straight into the snapshot.
 */

export interface TouchCapabilities {
  readonly maxTouchPoints: number;
  readonly isTouch: boolean;
  readonly isCoarse: boolean;
  readonly isFine: boolean;
  readonly canHover: boolean;
}
