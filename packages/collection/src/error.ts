/**
 * Public errors for `@ailuracode/alpine-collection`.
 */

import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core";

export type CollectionErrorCode =
  | "INVALID_OPTIONS"
  | "INVALID_KEY"
  | "INVALID_PAGINATION"
  | "INVALID_COMPARATOR"
  | "CONTROLLER_DESTROYED";

const COLLECTION_TOOLKIT_CODES: readonly CollectionErrorCode[] = [
  "INVALID_OPTIONS",
  "INVALID_KEY",
  "INVALID_PAGINATION",
  "INVALID_COMPARATOR",
  "CONTROLLER_DESTROYED",
];

function assertCollectionCode(code: string): asserts code is ToolkitErrorCode {
  if (!(COLLECTION_TOOLKIT_CODES as readonly string[]).includes(code)) {
    throw new ToolkitError(
      `Unknown collection toolkit error code: ${code}`,
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }
}

export class CollectionError extends ToolkitError {
  constructor(message: string, code: CollectionErrorCode, options?: { cause?: unknown }) {
    assertCollectionCode(code);
    super(message, code as unknown as ToolkitErrorCode, options?.cause);
    this.name = "CollectionError";
  }
}
