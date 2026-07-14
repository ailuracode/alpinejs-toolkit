import { vi } from "vitest";

// Replace `globalThis.fetch` with a stub that rejects synchronously. This prevents
// happy-dom from registering in-flight fetch tasks when a test forgets to inject
// a custom `fetcher` — those tasks would otherwise be aborted during teardown and
// pollute the output with an `AbortError` from `AsyncTaskManager.abortAll()`.
// Tests that need real fetch behavior (e.g. typedFetch tests) inject their own
// `fetcher` mock per test.
if (typeof globalThis.fetch === "function") {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error(
        "globalThis.fetch is stubbed in tests. Pass a `fetcher` option to typedFetch/jsonApiClient/queryFn, or restore the original via `vi.unstubAllGlobals()`."
      );
    })
  );
}
