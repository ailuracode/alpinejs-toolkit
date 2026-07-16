/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * store / magic / cleanup registrations so the contract can be
 * asserted without booting the real runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { tabsPlugin } from "../src/index";

/**
 * Collision-avoidance: hosts that already own a `tabs` store can
 * rename the registrations without touching the controller. The
 * magic follows the store when only `storeKey` is provided, so the
 * common case is a single argument.
 */
describe("tabsPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    tabsPlugin({ storeKey: "panels" })(asAlpine(Alpine));
    expect(Alpine.stores.panels).toBeDefined();
    expect(Alpine.stores.tabs).toBeUndefined();
    expect(Alpine.magics.panels).toBeDefined();
  });

  it("lets magicKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    tabsPlugin({ storeKey: "panels", magicKey: "tabsState" })(asAlpine(Alpine));
    expect(Alpine.stores.panels).toBeDefined();
    expect(Alpine.stores.tabs).toBeUndefined();
    expect(Alpine.magics.tabsState).toBeDefined();
    expect(Alpine.magics.panels).toBeUndefined();
  });

  it("leaves the default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    tabsPlugin()(asAlpine(Alpine));
    expect(Alpine.stores.tabs).toBeDefined();
    expect(Alpine.magics.tabs).toBeDefined();
  });
});
