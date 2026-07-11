import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  catalogPackages,
  diffSurface,
  discoverPackages,
  expectedSizeLimitConfig,
  isAllowedPackageSurfaceName,
  isValidSideEffectsMetadata,
  publishablePackages,
  readBundleBudgetMetadata,
  readMarkdownPackageNames,
  runRepoCheck,
  validateSideEffectsMetadata,
} from "../scripts/repo-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("repo:check", () => {
  it("passes on the current repository", () => {
    const result = runRepoCheck({ root });
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.catalogCount).toBe(29);
  });

  it("allows package subpath aliases when the base package is cataloged", () => {
    const expected = new Set(["@ailuracode/alpine-query-kit"]);
    expect(isAllowedPackageSurfaceName("@ailuracode/alpine-query-kit/devtools", expected)).toBe(
      true
    );
    expect(isAllowedPackageSurfaceName("@ailuracode/alpine-unknown/extra", expected)).toBe(false);
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

  it('requires every public package to define a "size-limit" budget', () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));
    const missing = packages.filter((pkg) => !Array.isArray(pkg.manifest["size-limit"]));
    expect(missing.map((pkg) => pkg.folder)).toEqual([]);
  });

  it("requires bundle budget metadata on every public package", () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));

    for (const pkg of packages) {
      expect(readBundleBudgetMetadata(pkg)).not.toBeNull();
    }
  });

  it('keeps package "size-limit" configs synced with package metadata', () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));

    for (const pkg of packages) {
      const expected = expectedSizeLimitConfig(pkg);
      expect(expected).not.toBeNull();
      expect(pkg.manifest["size-limit"]).toEqual(expected);
    }
  });

  it("requires every publishable package to declare sideEffects metadata", () => {
    const packages = publishablePackages(discoverPackages(path.join(root, "packages")));
    const missing = packages.filter((pkg) => !("sideEffects" in pkg.manifest));

    expect(missing.map((pkg) => pkg.folder)).toEqual([]);
  });

  it("accepts false and non-empty allowlist sideEffects metadata", () => {
    expect(isValidSideEffectsMetadata(false)).toBe(true);
    expect(isValidSideEffectsMetadata(["./dist/setup.js", "*.css"])).toBe(true);
    expect(isValidSideEffectsMetadata(true)).toBe(false);
    expect(isValidSideEffectsMetadata([])).toBe(false);
    expect(isValidSideEffectsMetadata("false")).toBe(false);
    expect(isValidSideEffectsMetadata([""])).toBe(false);
  });

  it("rejects missing, invalid, and true sideEffects metadata", () => {
    const fixture = {
      folder: "fixture",
      name: "@ailuracode/alpine-fixture",
      dir: path.join(root, "packages", "fixture"),
      manifest: {},
      isPrivate: false,
    };

    expect(validateSideEffectsMetadata(fixture)).toContain(
      '@ailuracode/alpine-fixture: package.json missing "sideEffects"'
    );

    expect(
      validateSideEffectsMetadata({
        ...fixture,
        manifest: { sideEffects: true },
      })
    ).toContain(
      "@ailuracode/alpine-fixture: sideEffects must be false or a non-empty file allowlist, not true"
    );

    expect(
      validateSideEffectsMetadata({
        ...fixture,
        manifest: { sideEffects: [] },
      })
    ).toContain(
      "@ailuracode/alpine-fixture: sideEffects must be false or a non-empty array of file glob strings"
    );

    expect(
      validateSideEffectsMetadata({
        ...fixture,
        manifest: { sideEffects: false },
      })
    ).toEqual([]);
  });
});
