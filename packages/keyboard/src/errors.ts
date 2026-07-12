export type KeyboardErrorCode =
  | "KEYBOARD_DESTROYED"
  | "KEYBOARD_INVALID_SHORTCUT"
  | "KEYBOARD_DUPLICATE_ID"
  | "KEYBOARD_UNKNOWN_SCOPE";

export class KeyboardError extends Error {
  readonly code: KeyboardErrorCode;
  readonly cause?: unknown;

  constructor(message: string, code: KeyboardErrorCode, options: { cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "KeyboardError";
    this.code = code;
    this.cause = options.cause;
  }
}
