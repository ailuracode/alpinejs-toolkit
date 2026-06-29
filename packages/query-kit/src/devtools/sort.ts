import type { MutationDevtoolsEntryView, QueryDevtoolsEntryView } from "./merge-stores.js";

export const QUERY_SORT_OPTIONS = ["updated-desc", "updated-asc", "key-asc", "status"] as const;

export type QuerySortOption = (typeof QUERY_SORT_OPTIONS)[number];

export const MUTATION_SORT_OPTIONS = ["updated-desc", "updated-asc", "status"] as const;

export type MutationSortOption = (typeof MUTATION_SORT_OPTIONS)[number];

const STATUS_ORDER = {
  pending: 0,
  error: 1,
  success: 2,
  idle: 3,
} as const;

function formatKey(key: readonly unknown[]): string {
  return JSON.stringify(key);
}

function isActiveQuery(entry: QueryDevtoolsEntryView): boolean {
  return entry.isFetching || entry.fetchStatus === "fetching" || entry.status === "pending";
}

/** Timestamp used for updated-* sorts; in-flight queries bubble to the top on desc. */
export function querySortTimestamp(entry: QueryDevtoolsEntryView): number {
  const timestamp = Math.max(entry.dataUpdatedAt, entry.errorUpdatedAt);
  if (timestamp > 0) {
    return timestamp;
  }

  if (isActiveQuery(entry)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return 0;
}

function isActiveMutation(entry: MutationDevtoolsEntryView): boolean {
  return entry.status === "pending";
}

function mutationSortTimestamp(entry: MutationDevtoolsEntryView): number {
  if (entry.updatedAt > 0) {
    return entry.updatedAt;
  }

  if (isActiveMutation(entry)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return 0;
}

export function sortQueries(
  entries: QueryDevtoolsEntryView[],
  sort: QuerySortOption
): QueryDevtoolsEntryView[] {
  const sorted = [...entries];

  sorted.sort((left, right) => {
    switch (sort) {
      case "updated-asc":
        return (
          querySortTimestamp(left) - querySortTimestamp(right) ||
          left.entryId.localeCompare(right.entryId)
        );
      case "key-asc":
        return formatKey(left.key).localeCompare(formatKey(right.key));
      case "status":
        return (
          (STATUS_ORDER[left.status] ?? 99) - (STATUS_ORDER[right.status] ?? 99) ||
          formatKey(left.key).localeCompare(formatKey(right.key))
        );
      default:
        return (
          querySortTimestamp(right) - querySortTimestamp(left) ||
          right.entryId.localeCompare(left.entryId)
        );
    }
  });

  return sorted;
}

export function sortMutations(
  entries: MutationDevtoolsEntryView[],
  sort: MutationSortOption
): MutationDevtoolsEntryView[] {
  const sorted = [...entries];

  sorted.sort((left, right) => {
    switch (sort) {
      case "updated-asc":
        return (
          mutationSortTimestamp(left) - mutationSortTimestamp(right) ||
          left.entryId.localeCompare(right.entryId)
        );
      case "status":
        return (
          (STATUS_ORDER[left.status] ?? 99) - (STATUS_ORDER[right.status] ?? 99) ||
          right.updatedAt - left.updatedAt
        );
      default:
        return (
          mutationSortTimestamp(right) - mutationSortTimestamp(left) ||
          right.entryId.localeCompare(left.entryId)
        );
    }
  });

  return sorted;
}

export function querySortLabel(sort: QuerySortOption): string {
  switch (sort) {
    case "updated-asc":
      return "Oldest first";
    case "key-asc":
      return "Query key";
    case "status":
      return "Status";
    default:
      return "Last updated";
  }
}

export function mutationSortLabel(sort: MutationSortOption): string {
  switch (sort) {
    case "updated-asc":
      return "Oldest first";
    case "status":
      return "Status";
    default:
      return "Last updated";
  }
}

function compareQueryRecency(left: QueryDevtoolsEntryView, right: QueryDevtoolsEntryView): number {
  const leftActive = isActiveQuery(left);
  const rightActive = isActiveQuery(right);

  if (leftActive !== rightActive) {
    return leftActive ? 1 : -1;
  }

  const leftTime = Math.max(left.dataUpdatedAt, left.errorUpdatedAt);
  const rightTime = Math.max(right.dataUpdatedAt, right.errorUpdatedAt);

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.entryId.localeCompare(right.entryId);
}

/** Picks the most recently active query from a list (ignores current sort order). */
export function pickLatestQuery(
  entries: QueryDevtoolsEntryView[]
): QueryDevtoolsEntryView | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  return entries.reduce((latest, entry) =>
    compareQueryRecency(entry, latest) > 0 ? entry : latest
  );
}

/** Picks the most recently updated mutation from a list. */
export function pickLatestMutation(
  entries: MutationDevtoolsEntryView[]
): MutationDevtoolsEntryView | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  return entries.reduce((latest, entry) => (entry.updatedAt >= latest.updatedAt ? entry : latest));
}
