import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  catalogPackages,
  diffSurface,
  discoverPackages,
  readMarkdownPackageNames,
  runRepoCheck,
} from "../scripts/repo-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("repo:check", () => {
  it("passes on the current repository", () => {
    const result = runRepoCheck({ root });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.catalogCount).toBe(28);
  });

  it("detects drift when a catalog package is missing from README surfaces", () => {
    const packages = discoverPackages(path.join(root, "packages"));
    const catalog = catalogPackages(packages);
    const readmeNames = readMarkdownPackageNames(path.join(root, "README.md"));

    const driftedCatalog = [
      ...catalog,
      {
        folder: "fixture-drift",
        name: "@ailuracode/alpine-fixture-drift",
        dir: path.join(root, "packages", "fixture-drift"),
        manifest: {},
        isPrivate: false,
      },
    ];

    const errors = diffSurface(readmeNames, driftedCatalog, "README.md package catalog");
    expect(errors).toContain("README.md package catalog: missing @ailuracode/alpine-fixture-drift");
    expect(readmeNames.has("@ailuracode/alpine-fixture-drift")).toBe(false);
  });
});
