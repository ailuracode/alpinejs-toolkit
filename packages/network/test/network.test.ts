import { describe, expect, expectTypeOf, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import networkPlugin, {
  createNetworkState,
  type NetworkMagic,
  readNetworkState,
} from "../src/index.js";

describe("@ailuracode/alpinejs-network type inference", () => {
  it("types NetworkMagic getters", () => {
    expectTypeOf<NetworkMagic["isOnline"]>().toEqualTypeOf<boolean>();
    expectTypeOf<NetworkMagic["isOffline"]>().toEqualTypeOf<boolean>();
  });

  it("types readNetworkState() return shape", () => {
    const state = readNetworkState();

    expectTypeOf(state.isOnline).toEqualTypeOf<boolean>();
    expectTypeOf(state.isOffline).toEqualTypeOf<boolean>();
    expectTypeOf(state).toEqualTypeOf<NetworkMagic>();
  });

  it("types $network the same as NetworkMagic", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    const { network } = createMagicHarness(networkPlugin) as { network: NetworkMagic };

    expectTypeOf(network).toEqualTypeOf<NetworkMagic>();
    expectTypeOf(network.isOnline).toEqualTypeOf<boolean>();
    expectTypeOf(network.isOffline).toEqualTypeOf<boolean>();
  });

  it("types createNetworkState()", () => {
    const state = createNetworkState(true);

    expectTypeOf(state.isOnline).toEqualTypeOf<boolean>();
    expectTypeOf(state.isOffline).toEqualTypeOf<boolean>();
    expectTypeOf(state).toExtend<NetworkMagic>();
  });
});

describe("@ailuracode/alpinejs-network", () => {
  it("registers $network with isOnline state", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });

    const { network } = createMagicHarness(networkPlugin) as { network: NetworkMagic };
    expect(network.isOnline).toBe(true);
    expect(network.isOffline).toBe(false);
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
    expect(network.isOffline).toBe(true);
  });

  it("updates isOnline on online event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { network } = createMagicHarness(networkPlugin) as { network: NetworkMagic };
    expect(network.isOnline).toBe(false);
    expect(network.isOffline).toBe(true);

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    window.dispatchEvent(new Event("online"));

    expect(network.isOnline).toBe(true);
    expect(network.isOffline).toBe(false);
  });

  it("reads navigator state via readNetworkState()", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    expect(readNetworkState()).toEqual({
      isOnline: false,
      isOffline: true,
    });
  });
});
