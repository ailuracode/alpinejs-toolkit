import { ToolkitError } from "./error";

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

    const stack = this.#stack;
    let firstError: unknown;

    while (stack.length > 0) {
      const cleanup = stack.pop();

      if (cleanup === undefined) {
        continue;
      }

      try {
        cleanup();
      } catch (error) {
        if (firstError === undefined) {
          firstError = error;
        }
      }
    }

    if (firstError !== undefined) {
      throw new ToolkitError(
        "One or more cleanup callbacks threw during dispose()",
        "TOOLKIT_INVALID_STATE",
        firstError
      );
    }
  }
}
