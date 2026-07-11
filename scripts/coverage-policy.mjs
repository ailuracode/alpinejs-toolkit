/**
 * Shared per-package coverage policy for Vitest workspace projects (ALP-23).
 *
 * Each package is gated by its own coverage floor so a weakly tested package
 * can no longer pass CI on the back of coverage from other workspaces. Floors
 * are ratcheted: a package's floor starts at (measured baseline - 1), with a
 * minimum of 40% so enforcement is real but achievable, and never below the
 * global default for a metric once the package has reached it.
 *
 * Packages listed under `exempt` are documented exceptions that fall below the
 * 40% minimum; their tests still run but the coverage gate is skipped until
 * their coverage is raised (see ALP-23 acceptance criteria).
 *
 * To raise a floor (improve the bar), edit `scripts/coverage-policy.json`.
 * To lower a floor, justify it in the PR and keep it >= the documented minimum.
 */

import { readFileSync } from "node:fs";

/** Baseline global thresholds retained as the default floor for each metric. */
export const GLOBAL_THRESHOLDS = {
  lines: 80,
  statements: 80,
  functions: 70,
  branches: 75,
};

/**
 * @param {string} policyPath
 * @returns {{ defaults: Record<string, number>, packages: Record<string, Record<string, number>>, note?: string }}
 */
export function loadCoveragePolicy(policyPath) {
  return JSON.parse(readFileSync(policyPath, "utf8"));
}

/**
 * Whether a package is a documented coverage exception below the minimum floor.
 * Exempt packages still run their tests; the coverage gate is skipped.
 * @param {{ exempt?: Record<string, string> }} policy
 * @param {string} packageName
 * @returns {boolean}
 */
export function isExempt(policy, packageName) {
  return Boolean(policy.exempt?.[packageName]);
}

/**
 * Resolve the threshold floor for a package. Falls back to the global default
 * when the package is not yet listed in the policy (e.g. a new package is added
 * before its baseline is recorded).
 *
 * @param {{ defaults: Record<string, number>, packages: Record<string, Record<string, number>> }} policy
 * @param {string} packageName
 * @returns {{ lines: number, statements: number, functions: number, branches: number }}
 */
export function resolveThresholds(policy, packageName) {
  const defaults = policy.defaults ?? GLOBAL_THRESHOLDS;
  const override = policy.packages?.[packageName];

  return {
    lines: override?.lines ?? defaults.lines ?? GLOBAL_THRESHOLDS.lines,
    statements: override?.statements ?? defaults.statements ?? GLOBAL_THRESHOLDS.statements,
    functions: override?.functions ?? defaults.functions ?? GLOBAL_THRESHOLDS.functions,
    branches: override?.branches ?? defaults.branches ?? GLOBAL_THRESHOLDS.branches,
  };
}
