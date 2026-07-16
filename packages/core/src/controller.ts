import { type Cleanup, CleanupStack } from "./cleanup.js";
import { ToolkitError } from "./error.js";
import { EventEmitter, type Unsubscribe } from "./event.js";

let counter = 0;

export const generateId = (prefix: string): string => `${prefix}-${(++counter).toString(36)}`;

export type LifecyclePhase = "idle" | "mounted" | "destroyed";

export abstract class BaseController<
  EventMap extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly #events = new EventEmitter<EventMap>();
  readonly #cleanup = new CleanupStack();
  readonly #id: string;
  #mounted = false;
  #destroyed = false;

  constructor(id?: string) {
    this.#id = id ?? generateId("controller");
  }

  get id(): string {
    return this.#id;
  }

  get isMounted(): boolean {
    return this.#mounted;
  }

  get isDestroyed(): boolean {
    return this.#destroyed;
  }

  get phase(): LifecyclePhase {
    return this.#destroyed ? "destroyed" : this.#mounted ? "mounted" : "idle";
  }

  protected registerCleanup(cleanup: Cleanup): Cleanup {
    return this.#cleanup.push(cleanup);
  }

  on<Key extends keyof EventMap>(
    event: Key,
    listener: (detail: EventMap[Key]) => void
  ): Unsubscribe {
    return this.#events.on(event, listener);
  }

  once<Key extends keyof EventMap>(
    event: Key,
    listener: (detail: EventMap[Key]) => void
  ): Unsubscribe {
    return this.#events.once(event, listener);
  }

  off<Key extends keyof EventMap>(event: Key, listener: (detail: EventMap[Key]) => void): void {
    this.#events.off(event, listener);
  }

  removeAllListeners(): void {
    this.#events.removeAllListeners();
  }

  listenerCount<Key extends keyof EventMap>(event?: Key): number {
    return this.#events.listenerCount(event);
  }

  protected emit<Key extends keyof EventMap>(event: Key, detail: EventMap[Key]): void {
    this.#events.emit(event, detail);
  }

  mount(): void {
    if (this.#destroyed) {
      throw new ToolkitError(`mount() after destroy(): ${this.#id}`, "CONTROLLER_DESTROYED");
    }
    this.#mounted = true;
  }

  destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#cleanup.dispose();
    this.removeAllListeners();
    this.#mounted = false;
    this.#destroyed = true;
  }
}
