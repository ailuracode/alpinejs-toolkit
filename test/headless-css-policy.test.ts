import { describe, expect, it } from "vitest";
import {
  findHeadlessCssViolations,
  isDevelopmentToolingPath,
  isHeadlessCssScanPath,
} from "../scripts/headless-css-policy.mjs";

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
});
