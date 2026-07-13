/**
 * Public errors for `@ailuracode/alpine-selection`.
 */

import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core";

export type SelectionErrorCode = "INSTANCE_NOT_FOUND" | "INVALID_KEY" | "INVALID_VALUE";

export class SelectionError extends ToolkitError {
  constructor(message: string, code: SelectionErrorCode, options?: { cause?: unknown }) {
    super(message, code as unknown as ToolkitErrorCode, options?.cause);
    this.name = "SelectionError";
  }
}
