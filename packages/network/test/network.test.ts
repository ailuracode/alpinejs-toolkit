import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import networkPlugin, { type NetworkMagic } from "../src/index.js";

describe("@ailuracode/alpine-network", () => {
  it("registers $network with isOnline state", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    const { network } = createMagicHarness(networkPlugin) as { network: NetworkMagic };
    expect(network.isOnline).toBe(true);
  });

  it("updates isOnline on offline event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    const { network } = createMagicHarness(networkPlugin) as { network: NetworkMagic };

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    window.dispatchEvent(new Event("offline"));

    expect(network.isOnline).toBe(false);
  });

  it("updates isOnline on online event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { network } = createMagicHarness(networkPlugin) as { network: NetworkMagic };
    expect(network.isOnline).toBe(false);

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));

    expect(network.isOnline).toBe(true);
  });
});
