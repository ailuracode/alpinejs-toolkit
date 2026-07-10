import { ToolkitError } from "./error";

export interface RegisteredInstance<T> {
  readonly id: string;
  readonly instance: T;
}

export class InstanceRegistry<T> {
  readonly #instances = new Map<string, T>();

  register(id: string, instance: T): void {
    if (this.#instances.has(id)) {
      throw new ToolkitError(`Instance "${id}" is already registered`, "TOOLKIT_INVALID_STATE");
    }
    this.#instances.set(id, instance);
  }

  unregister(id: string): boolean {
    return this.#instances.delete(id);
  }

  get(id: string): T | undefined {
    return this.#instances.get(id);
  }

  values(): readonly T[] {
    return [...this.#instances.values()];
  }

  entries(): readonly RegisteredInstance<T>[] {
    return [...this.#instances.entries()].map(([id, instance]) => ({ id, instance }));
  }

  has(id: string): boolean {
    return this.#instances.has(id);
  }

  get size(): number {
    return this.#instances.size;
  }

  clear(): void {
    this.#instances.clear();
  }
}
