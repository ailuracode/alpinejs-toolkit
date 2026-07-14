/**
 * Public errors for `@ailuracode/alpine-history`.
 */

import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core";

export type HistoryErrorCode =
  | "CONTROLLER_DESTROYED"
  | "EMPTY_UNDO_STACK"
  | "EMPTY_REDO_STACK"
  | "TRANSACTION_ACTIVE";

export class HistoryError extends ToolkitError {
  constructor(message: string, code: HistoryErrorCode, options?: { cause?: unknown }) {
    super(message, code as unknown as ToolkitErrorCode, options?.cause);
    this.name = "HistoryError";
  }
}
