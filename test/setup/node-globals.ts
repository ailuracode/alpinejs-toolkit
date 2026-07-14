/**
 * Minimal browser globals for Node Vitest tests that still resolve singleton
 * scope via `document` or need a no-op `window` event target.
 */
import { beforeEach, vi } from "vitest";

function createEventTarget() {
  const listeners = new Map<string, Set<EventListener>>();

  return {
    addEventListener(type: string, listener: EventListener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)?.add(listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event: Event) {
      const handlers = listeners.get(event.type);
      if (handlers) {
        for (const listener of handlers) {
          listener(event);
        }
      }
      return true;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("document", createEventTarget());
  vi.stubGlobal("window", {
    ...createEventTarget(),
    matchMedia: undefined,
  });
});
