/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import { describe, expect, it } from "vitest";
import { asAlpine, createMockAlpine } from "../../../test/mock-alpine";
import { sidebarPlugin } from "../src/index";

describe("sidebarPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    sidebarPlugin({ storeKey: "drawer" })(asAlpine(Alpine));
    expect(Alpine.stores.drawer).toBeDefined();
    expect(Alpine.stores.sidebar).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    sidebarPlugin({})(asAlpine(Alpine));
    expect(Alpine.stores.sidebar).toBeDefined();
    expect(Alpine.stores.drawer).toBeUndefined();
  });
});
