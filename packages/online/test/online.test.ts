import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import onlinePlugin, { type OnlineMagic } from "../src/index.js";

describe("@ailuracode/alpine-online", () => {
  it("registers $online with isOnline state", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    const { online } = createMagicHarness(onlinePlugin) as { online: OnlineMagic };
    expect(online.isOnline).toBe(true);
  });

  it("updates isOnline on offline event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    const { online } = createMagicHarness(onlinePlugin) as { online: OnlineMagic };

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    window.dispatchEvent(new Event("offline"));

    expect(online.isOnline).toBe(false);
  });

  it("updates isOnline on online event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { online } = createMagicHarness(onlinePlugin) as { online: OnlineMagic };
    expect(online.isOnline).toBe(false);

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));

    expect(online.isOnline).toBe(true);
  });
});
