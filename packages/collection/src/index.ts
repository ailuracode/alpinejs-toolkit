/**
 * Public entrypoint for `@ailuracode/alpine-collection`.
 *
 * The package ships a single headless controller — `createCollectionController`
 * — and the type taxonomy that consumers + plugins compose with. There is no
 * Alpine plugin in this release; that is added in a follow-up Linear issue.
 *
 * Exports are grouped by:
 *   1. **Controller** — factory + class.
 *   2. **Errors** — public `CollectionError` + stable error code type.
 *   3. **Types** — option shapes, view items, events, snapshots.
 *
 * Internal pipeline stages live in `./internal/` and are deliberately NOT
 * re-exported here. Consumers composing around `CollectionController` should
 * extend via subclassing or composition, not by reaching into helpers.
 */

export {
  CollectionController,
  createCollectionController,
} from "./controller.js";
export { CollectionError, type CollectionErrorCode } from "./error.js";
export type {
  CollectionChangeDetail,
  CollectionChangeReason,
  CollectionEvents,
  CollectionViewDetail,
} from "./events.js";
export type {
  CollectionCompareFn,
  CollectionFilterOptions,
  CollectionGroup,
  CollectionGroupKey,
  CollectionGroupKeyFn,
  CollectionGroupOptions,
  CollectionInstance,
  CollectionKey,
  CollectionKeyFn,
  CollectionMatchFn,
  CollectionOptions,
  CollectionPaginateOptions,
  CollectionPagination,
  CollectionPredicate,
  CollectionSelectionLike,
  CollectionSortDirection,
  CollectionSortOptions,
  CollectionViewItem,
} from "./types.js";
