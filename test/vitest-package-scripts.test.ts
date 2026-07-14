import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { discoverPackages } from "../scripts/repo-check.mjs";
import {
  expectedVitestScripts,
  isScopedVitestCommand,
  packageHasLocalVitestConfig,
  usesAmbiguousTestFilter,
  validatePackageVitestScripts,
} from "../scripts/vitest-package-scripts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

describe("vitest package scripts", () => {
  it("detects the ambiguous positional test filter", () => {
    expect(usesAmbiguousTestFilter("vitest run --config ../../vitest.config.ts test")).toBe(true);
    expect(
      usesAmbiguousTestFilter("vitest run --config ../../vitest.config.ts packages/dialog")
    ).toBe(false);
    expect(usesAmbiguousTestFilter("vitest run")).toBe(false);
  });

  it("requires root-config packages to scope by packages/<folder>", () => {
    expect(
      isScopedVitestCommand(
        "vitest run --config ../../vitest.config.ts packages/dialog",
        "dialog",
        false
      )
    ).toBe(true);
    expect(
      isScopedVitestCommand("vitest run --config ../../vitest.config.ts test", "dialog", false)
    ).toBe(false);
  });

  it("requires local-config packages to avoid the root config", () => {
    expect(isScopedVitestCommand("vitest run", "theme", true)).toBe(true);
    expect(
      isScopedVitestCommand(
        "vitest run --config ../../vitest.config.ts packages/theme",
        "theme",
        true
      )
    ).toBe(false);
  });

  it("passes on the current repository package scripts", () => {
    const packages = discoverPackages(packagesDir);
    const errors = validatePackageVitestScripts(packages, packagesDir);

    expect(errors).toEqual([]);
  });

  it("proves a package command cannot collect unrelated tests via test filter", () => {
    const dialog = discoverPackages(packagesDir).find((pkg) => pkg.folder === "dialog");
    expect(dialog).toBeDefined();

    const scripts = dialog?.manifest.scripts as Record<string, string> | undefined;
    expect(scripts?.test).toBe("vitest run --config ../../vitest.config.ts packages/dialog");
    expect(usesAmbiguousTestFilter(scripts?.test)).toBe(false);
    expect(
      expectedVitestScripts("dialog", packageHasLocalVitestConfig("dialog", packagesDir))
    ).toEqual({
      test: "vitest run --config ../../vitest.config.ts packages/dialog",
      "test:watch": "vitest --config ../../vitest.config.ts packages/dialog",
      "test:coverage": "vitest run --coverage --config ../../vitest.config.ts packages/dialog",
    });
  });
});
