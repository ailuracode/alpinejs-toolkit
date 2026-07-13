export type EventListener<EventMap, Key extends keyof EventMap> = (detail: EventMap[Key]) => void;

export type Unsubscribe = () => void;

export type AnyListener = (detail: unknown) => void;

export interface ListenerRecord<EventMap> {
  readonly event: keyof EventMap;
  readonly listener: AnyListener;
  readonly once: boolean;
}

export class EventEmitter<EventMap extends Record<string, unknown>> {
  readonly #listeners: ListenerRecord<EventMap>[] = [];

  on<Key extends keyof EventMap>(event: Key, listener: EventListener<EventMap, Key>): Unsubscribe {
    return this.#subscribe(event, listener, false);
  }

  once<Key extends keyof EventMap>(
    event: Key,
    listener: EventListener<EventMap, Key>
  ): Unsubscribe {
    return this.#subscribe(event, listener, true);
  }

  off<Key extends keyof EventMap>(event: Key, listener: EventListener<EventMap, Key>): void {
    const target = listener as AnyListener;

    for (let i = this.#listeners.length - 1; i >= 0; i--) {
      const record = this.#listeners[i];

      if (record.event === event && record.listener === target) {
        this.#listeners.splice(i, 1);
      }
    }
  }

  removeAllListeners(): void {
    this.#listeners.length = 0;
  }

  emit<Key extends keyof EventMap>(event: Key, detail: EventMap[Key]): void {
    const snapshot = this.#listeners.slice();

    for (let i = 0, len = snapshot.length; i < len; i++) {
      const record = snapshot[i];

      if (record.event !== event) {
        continue;
      }

      if (record.once) {
        this.#remove(record);
      }

      record.listener(detail);
    }
  }

  listenerCount<Key extends keyof EventMap>(event?: Key): number {
    const listeners = this.#listeners;

    if (event === undefined) {
      return listeners.length;
    }

    let count = 0;

    for (let i = 0, len = listeners.length; i < len; i++) {
      if (listeners[i].event === event) {
        count++;
      }
    }

    return count;
  }

  #subscribe<Key extends keyof EventMap>(
    event: Key,
    listener: EventListener<EventMap, Key>,
    once: boolean
  ): Unsubscribe {
    const record: ListenerRecord<EventMap> = {
      event,
      listener: listener as AnyListener,
      once,
    };

    this.#listeners.push(record);

    return () => this.#remove(record);
  }

  #remove(record: ListenerRecord<EventMap>): void {
    const index = this.#listeners.indexOf(record);

    if (index >= 0) {
      this.#listeners.splice(index, 1);
    }
  }
}
