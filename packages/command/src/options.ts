import { createRanker, legacyFilterToRank } from "./search.js";
import type { CommandPluginOptions, NormalizedCommandOptions } from "./types.js";

export const DEFAULT_EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';
export const DEFAULT_MAX_RECENT = 10;
export const ROOT_PAGE_ID = "root";

/** Normalizes command controller and plugin options once at construction. */
export function normalizeCommandOptions(
  options: CommandPluginOptions = {}
): NormalizedCommandOptions {
  const strategy = options.searchStrategy ?? "substring";
  const rank =
    options.rank ?? (options.filter ? legacyFilterToRank(options.filter) : createRanker(strategy));

  return {
    id: options.id,
    onOpen: options.onOpen,
    onClose: options.onClose,
    onRun: options.onRun,
    rank,
    searchStrategy: strategy,
    persistence: {
      maxRecent: options.persistence?.maxRecent ?? DEFAULT_MAX_RECENT,
      getRecent: options.persistence?.getRecent,
      setRecent: options.persistence?.setRecent,
      getPinned: options.persistence?.getPinned,
      setPinned: options.persistence?.setPinned,
    },
    overlayId: options.overlayId,
    editableSelector: options.editableSelector ?? DEFAULT_EDITABLE_SELECTOR,
    idPrefix: options.idPrefix ?? "command",
    closeOnRun: options.closeOnRun !== false,
    scroll: options.scroll,
    scrollLock: options.scrollLock !== false,
  };
}
