import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  findHeadlessCssViolations,
  isDevelopmentToolingPath,
  isHeadlessCssScanPath,
  validateHeadlessCssPolicy,
} from "../scripts/headless-css-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {string} dir
 * @param {(filePath: string) => void} visit
 */
function readDirRecursive(dir: string, visit: (filePath: string) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readDirRecursive(fullPath, visit);
    } else {
      visit(fullPath);
    }
  }
}

describe("headless CSS policy", () => {
  it("treats query devtools source as development tooling", () => {
    expect(isDevelopmentToolingPath("packages/query-kit/src/devtools/theme.ts")).toBe(true);
    expect(isHeadlessCssScanPath("packages/query-kit/src/devtools/ui-styles.ts")).toBe(false);
  });

  it("scans headless package source outside devtools paths", () => {
    expect(isHeadlessCssScanPath("packages/theme/src/plugin.ts")).toBe(true);
    expect(isHeadlessCssScanPath("packages/query-kit/src/plugin.ts")).toBe(true);
    expect(isHeadlessCssScanPath("packages/query-kit/test/theme.test.ts")).toBe(false);
  });

  it("flags styled UI markers in headless source", () => {
    const violations = findHeadlessCssViolations('export const UI_STYLES = { ":root.dark": "" };');
    expect(violations.map((rule) => rule.id)).toEqual(
      expect.arrayContaining(["devtools-style-surface", "host-dark-selector"])
    );
  });

  it("passes on the current repository", () => {
    const policy = validateHeadlessCssPolicy as typeof validateHeadlessCssPolicy & {
      readFile: (filePath: string) => string;
    };
    policy.readFile = (filePath: string) => readFileSync(filePath, "utf8");
    const errors = validateHeadlessCssPolicy(root, readDirRecursive);
    expect(errors).toEqual([]);
  });
});
