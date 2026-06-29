import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import envPlugin, {
  type NetworkMagic,
  type PlatformMagic,
  type VisibilityMagic,
} from "../src/index.js";

describe("@ailuracode/alpine-env", () => {
  it("registers all environment magics by default", () => {
    const harness = createMagicHarness(envPlugin()) as {
      network: NetworkMagic;
      visibility: VisibilityMagic;
      battery: { isAvailable: boolean };
      platform: PlatformMagic;
    };

    expect(harness.network.isOnline).toBe(true);
    expect(harness.visibility.isVisible).toBe(true);
    expect(harness.battery.isAvailable).toBe(false);
    expect(harness.platform.name).toBeTypeOf("string");
  });

  it("skips plugins when disabled in options", () => {
    const harness = createMagicHarness(
      envPlugin({ network: true, visibility: false, battery: false, platform: false })
    ) as { network?: NetworkMagic; visibility?: VisibilityMagic };

    expect(harness.network?.isOnline).toBe(true);
    expect(harness.visibility).toBeUndefined();
  });
});
