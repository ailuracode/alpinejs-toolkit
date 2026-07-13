import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  analyzeChangedFiles,
  changedPackageFolders,
  isDocumentationOnlyChange,
} from "../scripts/ci-changes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("ci:changes", () => {
  it("treats package README and CHANGELOG edits as documentation-only", () => {
    const files = ["packages/theme/README.md", "packages/theme/CHANGELOG.md"];

    expect(isDocumentationOnlyChange(files)).toBe(true);
    expect(changedPackageFolders(files)).toEqual([]);
  });

  it("detects source changes without package docs", () => {
    const files = ["packages/theme/src/controller.ts", "packages/theme/README.md"];

    expect(isDocumentationOnlyChange(files)).toBe(false);
    expect(changedPackageFolders(files)).toEqual(["theme"]);
  });

  it("skips heavy validation for documentation-only pull requests", () => {
    const result = analyzeChangedFiles(["docs/guide.md", "packages/theme/README.md"], { root });

    expect(result.docsOnly).toBe(true);
    expect(result.runValidate).toBe(false);
    expect(result.runAudit).toBe(false);
  });

  it("runs full CI for shared tooling changes", () => {
    const result = analyzeChangedFiles(["vitest.config.ts"], { root });

    expect(result.runFull).toBe(true);
    expect(result.runRepoCheck).toBe(true);
    expect(result.runPack).toBe(true);
  });

  it("includes dependents when core changes", () => {
    const result = analyzeChangedFiles(["packages/core/src/index.ts"], { root });

    expect(result.changedFolders).toEqual(["core"]);
    expect(result.testFolders).toContain("core");
    expect(result.testFolders).toContain("theme");
    expect(result.testFolders.length).toBeGreaterThan(2);
    expect(result.runAudit).toBe(false);
    expect(result.runDemo).toBe(true);
  });

  it("scopes pack and size checks to changed publishable packages", () => {
    const result = analyzeChangedFiles(["packages/toast/src/plugin.ts"], { root });

    expect(result.packFolders).toEqual(["toast"]);
    expect(result.runPack).toBe(true);
    expect(result.runSize).toBe(true);
    expect(result.runRepoCheck).toBe(false);
  });

  it("runs audit only when dependency manifests change", () => {
    const sourceOnly = analyzeChangedFiles(["packages/theme/src/plugin.ts"], { root });
    const lockfile = analyzeChangedFiles(["pnpm-lock.yaml", "vitest.config.ts"], { root });

    expect(sourceOnly.runAudit).toBe(false);
    expect(lockfile.runAudit).toBe(true);
  });

  it("enables E2E for packages with Playwright projects", () => {
    const result = analyzeChangedFiles(["packages/theme/e2e/theme.smoke.spec.ts"], { root });

    expect(result.runE2e).toBe(true);
    expect(result.e2eFolders).toEqual(["theme"]);
  });
});
