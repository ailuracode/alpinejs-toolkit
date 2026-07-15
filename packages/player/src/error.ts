import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core";

/** Stable error codes for `@ailuracode/alpine-player`. */
export type PlayerErrorCode =
  | "PLAYER_INVALID_ELEMENT"
  | "PLAYER_PICTURE_IN_PICTURE_UNSUPPORTED"
  | "PLAYER_MISSING_EXPRESSION";

/** Public error type for player operations. */
export class PlayerError extends ToolkitError {
  constructor(message: string, code: PlayerErrorCode, options?: { cause?: unknown }) {
    super(message, code as unknown as ToolkitErrorCode, options?.cause);
    this.name = "PlayerError";
  }
}
