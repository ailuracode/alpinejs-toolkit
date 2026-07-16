/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { menuPlugin } from "../src/index";

describe("menuPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    menuPlugin({ storeKey: "dropdown" })(asAlpine(Alpine));
    expect(Alpine.stores.dropdown).toBeDefined();
    expect(Alpine.stores.menu).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    menuPlugin({})(asAlpine(Alpine));
    expect(Alpine.stores.menu).toBeDefined();
    expect(Alpine.stores.dropdown).toBeUndefined();
  });
});
