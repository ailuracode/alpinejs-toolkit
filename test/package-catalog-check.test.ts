import { describe, expect, it } from "vitest";
import { parseCatalogEntries, parsePlaygroundDemoIds } from "../scripts/package-catalog-check.mjs";

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
});
