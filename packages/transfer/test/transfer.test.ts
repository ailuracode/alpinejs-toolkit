import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import transferPlugin, {
  type ClipboardMagic,
  type ExportMagic,
  type ShareMagic,
} from "../src/index.js";

describe("@ailuracode/alpine-transfer", () => {
  it("registers all transfer magics by default", () => {
    const harness = createMagicHarness(transferPlugin()) as {
      clipboard: ClipboardMagic;
      share: ShareMagic;
      export: ExportMagic;
    };

    expect(typeof harness.clipboard).toBe("function");
    expect(typeof harness.share).toBe("function");
    expect(typeof harness.export).toBe("function");
    expect(harness.share.isSupported).toBeTypeOf("boolean");
    expect(harness.export.isSupported).toBe(true);
  });

  it("skips plugins when disabled in options", () => {
    const harness = createMagicHarness(
      transferPlugin({ clipboard: true, share: false, export: false })
    ) as { clipboard?: ClipboardMagic; share?: ShareMagic };

    expect(typeof harness.clipboard).toBe("function");
    expect(harness.share).toBeUndefined();
  });
});
