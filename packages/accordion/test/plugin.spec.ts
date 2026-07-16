/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * store / magic / cleanup registrations so the contract can be
 * asserted without booting the real runtime.
 */

import { afterEach, describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { accordionPlugin } from "../src/index";

afterEach(() => {
  // Each test owns a fresh Alpine mock so no shared state leaks.
});

/**
 * Collision-avoidance: hosts that already own an `accordion` store
 * can rename the registrations without touching the controller. The
 * magic follows the store when only `storeKey` is provided, so the
 * common case is a single argument.
 */
describe("accordionPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    accordionPlugin({ storeKey: "faq" })(asAlpine(Alpine));
    expect(Alpine.stores.faq).toBeDefined();
    expect(Alpine.stores.accordion).toBeUndefined();
    expect(Alpine.magics.faq).toBeDefined();
  });

  it("lets magicKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    accordionPlugin({ storeKey: "faq", magicKey: "disclosure" })(asAlpine(Alpine));
    expect(Alpine.stores.faq).toBeDefined();
    expect(Alpine.stores.accordion).toBeUndefined();
    expect(Alpine.magics.disclosure).toBeDefined();
    expect(Alpine.magics.faq).toBeUndefined();
  });

  it("leaves the default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    accordionPlugin()(asAlpine(Alpine));
    expect(Alpine.stores.accordion).toBeDefined();
    expect(Alpine.magics.accordion).toBeDefined();
  });
});
