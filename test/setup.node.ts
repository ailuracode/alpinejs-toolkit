import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, vi } from "vitest";

afterEach(() => {
  clearAllSingletons();
});

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
