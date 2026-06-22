import type AlpineType from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import sharePlugin, {
  canShareData,
  createShareApi,
  isShareSupported,
  type ShareApi,
  shareData,
} from "../src/index.js";

function installSecureContext(): void {
  vi.stubGlobal("isSecureContext", true);
}

function installShareApi(
  options: {
    share?: ReturnType<typeof vi.fn>;
    canShare?: ReturnType<typeof vi.fn>;
    omitCanShare?: boolean;
  } = {}
): ReturnType<typeof vi.fn> {
  const share = options.share ?? vi.fn(() => Promise.resolve());
  const canShare = options.canShare ?? vi.fn(() => true);

  Object.defineProperty(navigator, "share", {
    configurable: true,
    writable: true,
    value: share,
  });

  if (!options.omitCanShare) {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      writable: true,
      value: canShare,
    });
  } else {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  }

  return share;
}

describe("@ailuracode/alpine-share", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("helpers", () => {
    it("isShareSupported() requires secure context and navigator.share", () => {
      installSecureContext();
      installShareApi();

      expect(isShareSupported()).toBe(true);
    });

    it("isShareSupported() is false outside a secure context", () => {
      vi.stubGlobal("isSecureContext", false);
      installShareApi();

      expect(isShareSupported()).toBe(false);
    });

    it("canShareData() delegates to navigator.canShare when available", () => {
      installSecureContext();
      const canShare = vi.fn(() => true);
      installShareApi({ canShare });
      const data = { title: "Hello", text: "World" };

      expect(canShareData(data)).toBe(true);
      expect(canShare).toHaveBeenCalledWith(data);
    });

    it("canShareData() falls back to payload checks when canShare is unavailable", () => {
      installSecureContext();
      installShareApi({ omitCanShare: true });

      expect(canShareData({ title: "Hello" })).toBe(true);
      expect(canShareData({ files: [new File(["a"], "a.txt")] })).toBe(false);
      expect(canShareData({})).toBe(false);
    });

    it("shareData() resolves true when navigator.share succeeds", async () => {
      installSecureContext();
      const share = installShareApi();
      const data = { title: "Share me", url: "https://example.com" };

      await expect(shareData(data)).resolves.toBe(true);
      expect(share).toHaveBeenCalledWith(data);
    });

    it("shareData() resolves false when the user dismisses the sheet", async () => {
      installSecureContext();
      installShareApi({
        share: vi.fn(() => Promise.reject(new DOMException("AbortError"))),
      });

      await expect(shareData({ title: "Share me" })).resolves.toBe(false);
    });

    it("shareData() resolves false when sharing is unavailable", async () => {
      vi.stubGlobal("isSecureContext", false);

      await expect(shareData({ title: "Share me" })).resolves.toBe(false);
    });
  });

  describe("plugin registration", () => {
    it("registers $store.share and $share from the same API object", () => {
      installSecureContext();
      installShareApi();

      let stored: ShareApi | undefined;
      let magicApi: ShareApi | undefined;

      const Alpine = {
        store(_name: string, value: ShareApi) {
          stored = value;
        },
        magic(_name: string, factory: () => ShareApi) {
          magicApi = factory();
        },
      };

      sharePlugin(Alpine as unknown as AlpineType.Alpine);

      expect(stored).toBe(magicApi);
      expect(stored?.isSupported()).toBe(true);
      expect(typeof stored?.share).toBe("function");
      expect(typeof stored?.canShare).toBe("function");
    });

    it("registers $store.share in Alpine", () => {
      installSecureContext();
      installShareApi();

      const Alpine = startAlpine(sharePlugin);
      const store = Alpine.store("share") as ShareApi;

      expect(store.isSupported()).toBe(true);
      expect(typeof store.share).toBe("function");
      expect(typeof store.canShare).toBe("function");
    });

    it("registers $share magic in Alpine", () => {
      installSecureContext();
      installShareApi();

      const { share } = createMagicHarness(sharePlugin) as { share: ShareApi };

      expect(share.isSupported()).toBe(true);
      expect(typeof share.share).toBe("function");
      expect(typeof share.canShare).toBe("function");
    });

    it("createShareApi() exposes the same methods", () => {
      const api = createShareApi();

      expect(api.share).toBe(shareData);
      expect(api.canShare).toBe(canShareData);
      expect(api.isSupported).toBe(isShareSupported);
    });
  });
});
