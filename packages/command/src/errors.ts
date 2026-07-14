export type CommandErrorCode =
  | "COMMAND_DESTROYED"
  | "COMMAND_DUPLICATE_ID"
  | "COMMAND_UNKNOWN_ITEM"
  | "COMMAND_UNKNOWN_PAGE"
  | "COMMAND_ALREADY_RUNNING";

export class CommandError extends Error {
  readonly code: CommandErrorCode;
  readonly cause?: unknown;

  constructor(message: string, code: CommandErrorCode, options: { cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "CommandError";
    this.code = code;
    this.cause = options.cause;
  }
}
