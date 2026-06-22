import type AlpineType from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import sharePlugin, {
  canShareData,
  createShareMagic,
  isShareSupported,
  type ShareMagic,
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
    it("registers only the $share magic", () => {
      installSecureContext();
      installShareApi();

      const store = vi.fn();
      let magicApi: ShareMagic | undefined;

      const Alpine = {
        store,
        magic(_name: string, factory: () => ShareMagic) {
          magicApi = factory();
        },
      };

      sharePlugin(Alpine as unknown as AlpineType.Alpine);

      expect(store).not.toHaveBeenCalled();
      expect(typeof magicApi).toBe("function");
      expect(magicApi?.isSupported()).toBe(true);
      expect(typeof magicApi?.canShare).toBe("function");
    });

    it("registers callable $share magic", async () => {
      installSecureContext();
      const navigatorShare = installShareApi();
      const data = { title: "Hello", url: "https://example.com" };

      const { share } = createMagicHarness(sharePlugin) as { share: ShareMagic };

      expect(share.isSupported()).toBe(true);
      expect(typeof share.canShare).toBe("function");
      await expect(share(data)).resolves.toBe(true);
      expect(navigatorShare).toHaveBeenCalledWith(data);
    });

    it("createShareMagic() exposes the public API", () => {
      const magic = createShareMagic();

      expect(magic.isSupported).toBe(isShareSupported);
      expect(magic.canShare).toBe(canShareData);
    });
  });
});
