import type { CommandItem, CommandRankFn } from "./types.js";

/** Builds the default searchable text fields for a command item. */
export function buildSearchHaystack(item: CommandItem): readonly string[] {
  return [
    item.label,
    item.group ?? "",
    item.shortcut ?? "",
    ...(item.keywords ?? []),
    ...(item.aliases ?? []),
  ];
}

/** Default substring ranker — higher scores surface earlier. */
export function defaultSubstringRank(item: CommandItem, search: string): number | null {
  const query = search.trim().toLowerCase();
  if (!query) {
    return 0;
  }

  const label = item.label.toLowerCase();
  if (label.startsWith(query)) {
    return 100;
  }
  if (label.includes(query)) {
    return 80;
  }

  for (const alias of item.aliases ?? []) {
    const normalized = alias.toLowerCase();
    if (normalized.startsWith(query)) {
      return 70;
    }
    if (normalized.includes(query)) {
      return 60;
    }
  }

  const haystack = buildSearchHaystack(item).join(" ").toLowerCase();
  if (haystack.includes(query)) {
    return 50;
  }

  return null;
}

/** Lightweight fuzzy ranker — consecutive character matches score higher. */
export function fuzzyRank(item: CommandItem, search: string): number | null {
  const query = search.trim().toLowerCase();
  if (!query) {
    return 0;
  }

  const label = item.label.toLowerCase();
  let score = 0;
  let queryIndex = 0;
  for (let index = 0; index < label.length && queryIndex < query.length; index++) {
    if (label[index] === query[queryIndex]) {
      score += 10;
      queryIndex++;
    }
  }

  if (queryIndex === query.length) {
    return score + (label.startsWith(query) ? 20 : 0);
  }

  return defaultSubstringRank(item, search);
}

/** Creates the effective rank function for the configured strategy. */
export function createRanker(
  strategy: "substring" | "fuzzy",
  custom?: CommandRankFn
): CommandRankFn {
  if (custom) {
    return custom;
  }
  if (strategy === "fuzzy") {
    return fuzzyRank;
  }
  return defaultSubstringRank;
}

/** Adapts a legacy boolean filter into a rank function. */
export function legacyFilterToRank(
  filter: (item: CommandItem, search: string) => boolean
): CommandRankFn {
  return (item, search) => (filter(item, search) ? 1 : null);
}
