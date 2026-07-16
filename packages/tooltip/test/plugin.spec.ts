/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { tooltipPlugin } from "../src/index";

describe("tooltipPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    tooltipPlugin({ storeKey: "hints" })(asAlpine(Alpine));
    expect(Alpine.stores.hints).toBeDefined();
    expect(Alpine.stores.tooltip).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    tooltipPlugin({})(asAlpine(Alpine));
    expect(Alpine.stores.tooltip).toBeDefined();
    expect(Alpine.stores.hints).toBeUndefined();
  });
});
