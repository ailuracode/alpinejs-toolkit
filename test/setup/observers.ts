import { vi } from "vitest";

class MockIntersectionObserver {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
}

class MockResizeObserver {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

if (typeof globalThis.ResizeObserver === "undefined") {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
}
