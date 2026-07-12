/**
 * Public errors for `@ailuracode/alpine-virtual`.
 */

import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core";

export type VirtualErrorCode = "INSTANCE_NOT_FOUND" | "INVALID_INDEX";

export class VirtualError extends ToolkitError {
  constructor(message: string, code: VirtualErrorCode, options?: { cause?: unknown }) {
    super(message, code as unknown as ToolkitErrorCode, options?.cause);
    this.name = "VirtualError";
  }
}
