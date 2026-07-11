/**
 * Strongly-typed event map for the dialog controller.
 */

import type { DialogChangeDetail, DialogCloseDetail, DialogOpenDetail } from "./types";

/**
 * Event map for dialog state changes. Two-event contract:
 * `open` fires when a dialog instance opens, `close` when it closes.
 * `change` fires after any instance registry or open-state mutation.
 */
export interface DialogEvents extends Record<string, unknown> {
  open: DialogOpenDetail;
  close: DialogCloseDetail;
  change: DialogChangeDetail;
}
