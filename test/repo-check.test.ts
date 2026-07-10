import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  catalogPackages,
  diffSurface,
  discoverPackages,
  expectedSizeLimitConfig,
  publishablePackages,
  readBundleBudgetMetadata,
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

  it("requires every public package to own a .size-limit.json budget", () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));
    const missing = packages.filter((pkg) => !existsSync(path.join(pkg.dir, ".size-limit.json")));
    expect(missing.map((pkg) => pkg.folder)).toEqual([]);
  });

  it("requires bundle budget metadata on every public package", () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));

    for (const pkg of packages) {
      expect(readBundleBudgetMetadata(pkg)).not.toBeNull();
    }
  });

  it("keeps checked-in size-limit configs synced with package metadata", () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));

    for (const pkg of packages) {
      const expected = expectedSizeLimitConfig(pkg);
      expect(expected).not.toBeNull();

      const actual = JSON.parse(readFileSync(path.join(pkg.dir, ".size-limit.json"), "utf8"));
      expect(actual).toEqual(expected);
    }
  });
});
