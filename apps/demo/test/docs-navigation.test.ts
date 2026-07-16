import { describe, expect, it } from "vitest";
import {
  buildDocsSidebar,
  getAdjacentDocumentedEntries,
  getDocumentedPackageCount,
} from "../src/catalog/docs-navigation.js";

describe("docs navigation", () => {
  it("builds category and family sidebar sections", () => {
    const labels = buildDocsSidebar().map((section) => section.label);
    expect(labels).toContain("Packages");
    expect(labels).toContain("Runtime & Composition");
    expect(labels).toContain("Browser Capabilities");
    expect(labels).not.toContain("Essentials");
    expect(labels).not.toContain("Advanced");
  });

  it("paginates within families", () => {
    const { prev, next } = getAdjacentDocumentedEntries("notify");
    expect(prev?.id).toBe("permissions");
    expect(next?.id).toBe("geo");
  });

  it("counts documented packages from the catalog", () => {
    expect(getDocumentedPackageCount()).toBe(38);
  });
});
