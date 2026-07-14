export type PermissionErrorCode =
  | "PERMISSION_UNSUPPORTED"
  | "PERMISSION_INSECURE_CONTEXT"
  | "PERMISSION_POLICY_BLOCKED"
  | "PERMISSION_PLATFORM_RESTRICTED"
  | "PERMISSION_DENIED"
  | "PERMISSION_NOT_REGISTERED"
  | "PERMISSION_DESTROYED"
  | "PERMISSION_REQUEST_FAILED"
  | "PERMISSION_CONCURRENT_REQUEST";

export class PermissionError extends Error {
  readonly code: PermissionErrorCode;
  readonly cause?: unknown;
  readonly permissionName?: string;

  constructor(
    message: string,
    code: PermissionErrorCode,
    options: { cause?: unknown; permissionName?: string } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "PermissionError";
    this.code = code;
    this.cause = options.cause;
    this.permissionName = options.permissionName;
  }
}
