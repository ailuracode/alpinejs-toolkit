import { describe, expect, it } from "vitest";
import {
  getCatalogEntriesByCategory,
  getCatalogEntriesByFamily,
  getFamiliesByCategory,
  PACKAGE_CATALOG,
  PACKAGE_CATEGORIES,
  PACKAGE_FAMILIES,
  validateCatalogRelations,
} from "../src/catalog/index.js";

describe("package catalog", () => {
  it("covers every public package folder except ui", () => {
    expect(PACKAGE_CATALOG).toHaveLength(34);
    expect(new Set(PACKAGE_CATALOG.map((entry) => entry.id)).size).toBe(34);
    expect(PACKAGE_CATALOG.every((entry) => entry.readmePath.startsWith("packages/"))).toBe(true);
  });

  it("uses distinct categories, families, roles, and badges", () => {
    const categories = new Set(PACKAGE_CATALOG.map((entry) => entry.category));
    expect(categories.size).toBe(PACKAGE_CATEGORIES.length);

    const families = new Set(
      PACKAGE_CATALOG.map((entry) => entry.family).filter((family) => family !== undefined)
    );
    expect(families.size).toBe(PACKAGE_FAMILIES.length);
  });

  it("models permissions and query as families", () => {
    const permissions = getCatalogEntriesByFamily("permissions").map((entry) => entry.id);
    expect(permissions).toEqual(["permissions", "notify", "geo", "attention"]);

    const queryStack = getCatalogEntriesByFamily("query-stack").map((entry) => entry.id);
    expect(queryStack).toEqual([
      "query",
      "query-adapter-alpine",
      "query-adapter-zustand",
      "query-kit",
    ]);
  });

  it("groups browser capabilities by category and family", () => {
    const families = getFamiliesByCategory("browser-capabilities");
    expect(families.map((family) => family.id)).toEqual(["permissions"]);

    const standalone = getCatalogEntriesByCategory("browser-capabilities").filter(
      (entry) => entry.family === undefined
    );
    expect(standalone.map((entry) => entry.id)).toEqual(["env", "transfer"]);
  });

  it("has valid relations and ordering metadata", () => {
    expect(validateCatalogRelations()).toEqual([]);
  });
});
