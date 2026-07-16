export type EventListener<EventMap, Key extends keyof EventMap> = (detail: EventMap[Key]) => void;
export type Unsubscribe = () => void;

type Record_<EventMap> = [keyof EventMap, (detail: unknown) => void, boolean];

export class EventEmitter<EventMap extends Record<string, unknown>> {
  readonly #listeners: Record_<EventMap>[] = [];

  on<Key extends keyof EventMap>(event: Key, listener: EventListener<EventMap, Key>): Unsubscribe {
    return this.#add(event, listener, false);
  }

  once<Key extends keyof EventMap>(
    event: Key,
    listener: EventListener<EventMap, Key>
  ): Unsubscribe {
    return this.#add(event, listener, true);
  }

  off<Key extends keyof EventMap>(event: Key, listener: EventListener<EventMap, Key>): void {
    const target = listener as (detail: unknown) => void;
    for (let i = this.#listeners.length - 1; i >= 0; i--) {
      const record = this.#listeners[i];
      if (record[0] === event && record[1] === target) {
        this.#listeners.splice(i, 1);
      }
    }
  }

  removeAllListeners(): void {
    this.#listeners.length = 0;
  }

  emit<Key extends keyof EventMap>(event: Key, detail: EventMap[Key]): void {
    for (const record of this.#listeners.slice()) {
      if (record[0] !== event) {
        continue;
      }
      if (record[2]) {
        this.#listeners.splice(this.#listeners.indexOf(record), 1);
      }
      record[1](detail);
    }
  }

  listenerCount<Key extends keyof EventMap>(event?: Key): number {
    if (event === undefined) {
      return this.#listeners.length;
    }
    let count = 0;
    for (const record of this.#listeners) {
      if (record[0] === event) {
        count++;
      }
    }
    return count;
  }

  #add<Key extends keyof EventMap>(
    event: Key,
    listener: EventListener<EventMap, Key>,
    once: boolean
  ): Unsubscribe {
    const record: Record_<EventMap> = [event, listener as (detail: unknown) => void, once];
    this.#listeners.push(record);
    return () => {
      const index = this.#listeners.indexOf(record);
      if (index >= 0) {
        this.#listeners.splice(index, 1);
      }
    };
  }
}
