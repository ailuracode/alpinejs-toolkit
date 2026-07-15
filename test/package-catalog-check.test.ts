import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseCatalogEntries,
  parsePlaygroundDemoIds,
  validatePackageCatalogSurfaces,
} from "../scripts/package-catalog-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("package catalog check", () => {
  it("parses catalog entries and playground demo ids", () => {
    const entries = parseCatalogEntries(
      'entry({ id: "theme", folder: "theme", npmPackage: "@ailuracode/alpine-theme", readmePath: "packages/theme/README.md", demo: { available: true } })'
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe("theme");

    const demoIds = parsePlaygroundDemoIds('  theme: ThemeDemo,\n  "query-kit": QueryKitDemo,');
    expect(demoIds).toEqual(new Set(["theme", "query-kit"]));
  });

  it("passes on the current repository surfaces", () => {
    expect(validatePackageCatalogSurfaces(root)).toEqual([]);
  });

  it("reports missing README sources", () => {
    const entries = parseCatalogEntries(
      'entry({ id: "theme", folder: "theme", npmPackage: "@ailuracode/alpine-theme", readmePath: "packages/missing/README.md" })'
    );
    expect(entries[0]?.readmePath).toBe("packages/missing/README.md");
  });
});
