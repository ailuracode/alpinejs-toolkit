/**
 * Strongly-typed event map for the command controller.
 */

import type { CommandItem } from "./types";

/**
 * Event map for command palette state changes.
 * `open` — palette opened.
 * `close` — palette closed.
 * `run` — a command was executed.
 */
export interface CommandEvents extends Record<string, unknown> {
  open: undefined;
  close: undefined;
  run: CommandItem;
}
