/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { overlayPlugin } from "../src/index";

describe("overlayPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    overlayPlugin({ storeKey: "stack" })(asAlpine(Alpine));
    expect(Alpine.stores.stack).toBeDefined();
    expect(Alpine.stores.overlay).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    overlayPlugin({})(asAlpine(Alpine));
    expect(Alpine.stores.overlay).toBeDefined();
    expect(Alpine.stores.stack).toBeUndefined();
  });
});
