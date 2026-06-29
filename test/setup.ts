import { beforeEach, vi } from "vitest";

const mediaListeners = new Map<string, Set<() => void>>();

interface MockMediaQueryList {
  media: string;
  matches: boolean;
  addEventListener(_event: string, listener: () => void): void;
  removeEventListener(_event: string, listener: () => void): void;
  addListener(listener: () => void): void;
  removeListener(listener: () => void): void;
  dispatch(matches: boolean): void;
}

function createMediaQueryList(query: string, matches = false): MockMediaQueryList {
  const listeners = new Set<() => void>();

  return {
    media: query,
    matches,
    addEventListener(_event, listener) {
      listeners.add(listener);
      mediaListeners.set(query, listeners);
    },
    removeEventListener(_event, listener) {
      listeners.delete(listener);
    },
    addListener(listener) {
      listeners.add(listener);
      mediaListeners.set(query, listeners);
    },
    removeListener(listener) {
      listeners.delete(listener);
    },
    dispatch(matches) {
      this.matches = matches;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

const mediaQueries = new Map<string, MockMediaQueryList>();

vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => {
    if (!mediaQueries.has(query)) {
      mediaQueries.set(query, createMediaQueryList(query));
    }
    return mediaQueries.get(query);
  })
);

export function setMatchMedia(query: string, matches: boolean): void {
  if (!mediaQueries.has(query)) {
    mediaQueries.set(query, createMediaQueryList(query, matches));
    return;
  }

  mediaQueries.get(query)?.dispatch(matches);
}

export function resetMatchMedia(): void {
  mediaQueries.clear();
  mediaListeners.clear();
}

beforeEach(() => {
  localStorage.clear();
  resetMatchMedia();
  document.documentElement.innerHTML = "<head></head><body></body>";
  document.body.innerHTML = "";
  document.body.removeAttribute("style");
  document.body.className = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});
