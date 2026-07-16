import { ToolkitError } from "./error.js";

export type Cleanup = () => void;

export class CleanupStack {
  readonly #stack: Cleanup[] = [];
  #disposed = false;

  get disposed(): boolean {
    return this.#disposed;
  }

  get size(): number {
    return this.#stack.length;
  }

  push(cleanup: Cleanup): Cleanup {
    if (this.#disposed) {
      cleanup();
      return cleanup;
    }
    this.#stack.push(cleanup);
    return cleanup;
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;

    const errors: unknown[] = [];
    for (let i = this.#stack.length - 1; i >= 0; i--) {
      try {
        this.#stack[i]();
      } catch (error) {
        errors.push(error);
      }
    }
    this.#stack.length = 0;

    if (errors.length === 0) {
      return;
    }

    const cause =
      errors.length === 1
        ? errors[0]
        : new AggregateError(errors, `${errors.length} cleanups failed`);
    throw new ToolkitError("Cleanup failed during dispose()", "TOOLKIT_INVALID_STATE", cause);
  }
}
