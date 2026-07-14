import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  analyzeChangedFiles,
  e2eFoldersForPackages,
  hasE2eInfraChanges,
} from "../scripts/ci-changes.mjs";
import { discoverE2ePackages } from "../scripts/e2e-run.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("e2e-run", () => {
  it("discovers package-owned Playwright projects", () => {
    const packages = discoverE2ePackages();

    expect(packages).toContain("theme");
  });
});

describe("ci:changes e2e detection", () => {
  it("flags shared E2E infrastructure changes", () => {
    expect(hasE2eInfraChanges(["e2e/playwright.base.ts"])).toBe(true);
    expect(hasE2eInfraChanges(["packages/theme/src/plugin.ts"])).toBe(false);
  });

  it("scopes E2E packages to folders with Playwright configs", () => {
    const available = new Set(discoverE2ePackages());
    const folders = e2eFoldersForPackages(["theme", "core"], available);

    expect(folders).toEqual(["core", "theme"]);
  });

  it("runs E2E when a package with a Playwright project changes", () => {
    const result = analyzeChangedFiles(["packages/theme/e2e/theme.smoke.spec.ts"], { root });

    expect(result.runE2e).toBe(true);
    expect(result.e2eFolders).toEqual(["theme"]);
  });

  it("runs E2E when shared infrastructure changes", () => {
    const result = analyzeChangedFiles(["e2e/server/start-fixture-server.mjs"], { root });

    expect(result.runFull).toBe(true);
    expect(result.runE2e).toBe(true);
  });
});
