export type ToolkitErrorCode =
  | "TOOLKIT_INVALID_ARGUMENT"
  | "TOOLKIT_INVALID_STATE"
  | "TOOLKIT_NOT_SUPPORTED"
  | "TOOLKIT_SINGLETON_SCOPE_REQUIRED"
  | "CONTROLLER_DESTROYED"
  | "REGISTRATION_COLLISION";

export class ToolkitError extends Error {
  readonly code: ToolkitErrorCode;
  readonly cause?: unknown;

  constructor(message: string, code: ToolkitErrorCode, cause?: unknown) {
    super(message);
    this.name = code;
    this.code = code;
    this.cause = cause;
  }
}
