/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { toastPlugin } from "../src/index";

/**
 * Collision-avoidance: hosts that already own a `toast` magic
 * can rename the integration without touching the controller.
 */
describe("toastPlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    toastPlugin({ magicKey: "snack" })(asAlpine(Alpine));
    expect(Alpine.magics.snack).toBeDefined();
    expect(Alpine.magics.toast).toBeUndefined();
  });

  it("leaves the default magicKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    toastPlugin({})(asAlpine(Alpine));
    expect(Alpine.magics.toast).toBeDefined();
    expect(Alpine.magics.snack).toBeUndefined();
  });

  it("registers the store and magic under a custom storeKey + magicKey pair", () => {
    const Alpine = createMockAlpine();
    toastPlugin({
      storeKey: "alerts" as never,
      magicKey: "snack",
    })(asAlpine(Alpine));
    expect(Alpine.stores.alerts).toBeDefined();
    expect(Alpine.magics.snack).toBeDefined();
    expect(Alpine.stores.toast).toBeUndefined();
    expect(Alpine.magics.toast).toBeUndefined();
  });
});
