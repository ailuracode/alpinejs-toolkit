export type ToolkitErrorCode =
  // Generic
  | "TOOLKIT_INVALID_ARGUMENT"
  | "TOOLKIT_INVALID_STATE"
  | "TOOLKIT_NOT_SUPPORTED"
  | "TOOLKIT_SINGLETON_SCOPE_REQUIRED"
  // Core / registry / loader
  | "PLUGIN_NAME_REQUIRED"
  | "PLUGIN_DUPLICATE"
  | "PLUGIN_UNKNOWN"
  | "PLUGIN_INVALID_DEFINITION"
  | "PLUGIN_LOADER_INVALID"
  | "PLUGIN_INIT_IN_FLIGHT"
  // Lifecycle
  | "CONTROLLER_DESTROYED";

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
