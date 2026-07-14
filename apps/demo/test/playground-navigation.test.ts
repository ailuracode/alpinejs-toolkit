import { describe, expect, it } from "vitest";
import {
  buildPlaygroundSidebar,
  getAdjacentPlaygroundEntries,
  getPlaygroundBreadcrumbs,
  playgroundFamilyPath,
} from "../src/catalog/playground-navigation.js";

describe("playground navigation", () => {
  it("builds nested category and family sidebar groups", () => {
    const browser = buildPlaygroundSidebar().find((group) => group.id === "browser-capabilities");
    expect(browser?.families.map((family) => family.id)).toContain("permissions");
    expect(browser?.standalone.map((entry) => entry.id)).toEqual(["env", "transfer"]);
  });

  it("paginates within playground families", () => {
    const { prev, next } = getAdjacentPlaygroundEntries("geo");
    expect(prev?.id).toBe("notify");
    expect(next?.id).toBe("attention");
  });

  it("builds breadcrumbs with category and family context", () => {
    const crumbs = getPlaygroundBreadcrumbs("notify");
    expect(crumbs.map((crumb) => crumb.label)).toEqual([
      "Playground",
      "Browser Capabilities",
      "Permissions",
      "Notify",
    ]);
    expect(crumbs[2]?.href).toBe(playgroundFamilyPath("browser-capabilities", "permissions"));
  });
});
