import { type Cleanup, CleanupStack } from "./cleanup";
import { generateControllerId } from "./controller-id";
import { ToolkitError } from "./error";
import { EventEmitter, type Unsubscribe } from "./event";

export type LifecyclePhase = "idle" | "mounted" | "destroyed";

export abstract class BaseController<
  EventMap extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly #events: EventEmitter<EventMap>;
  readonly #cleanup: CleanupStack;
  readonly #id: string;
  #phase: LifecyclePhase = "idle";

  constructor(id?: string) {
    this.#id = id ?? generateControllerId(this);
    this.#events = new EventEmitter<EventMap>();
    this.#cleanup = new CleanupStack();
  }

  get id(): string {
    return this.#id;
  }

  get phase(): LifecyclePhase {
    return this.#phase;
  }

  get isMounted(): boolean {
    return this.#phase === "mounted";
  }

  get isDestroyed(): boolean {
    return this.#phase === "destroyed";
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
    if (this.#phase === "destroyed") {
      throw new ToolkitError(
        `Cannot mount controller "${this.#id}" after destroy()`,
        "CONTROLLER_DESTROYED"
      );
    }
    if (this.#phase === "mounted") {
      return;
    }
    this.#phase = "mounted";
  }

  destroy(): void {
    if (this.#phase === "destroyed") {
      return;
    }
    try {
      this.#cleanup.dispose();
    } finally {
      this.#events.removeAllListeners();
      this.#phase = "destroyed";
    }
  }
}
