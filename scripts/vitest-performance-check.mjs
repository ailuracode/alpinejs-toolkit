#!/usr/bin/env node
/**
 * @fileoverview Tolerance-based Vitest performance regression check (ALP-135).
 *
 * Compares a warm workspace run against benchmarks/vitest-baseline.json.
 * Scheduled CI uses soft tolerances; severe regressions fail the job.
 *
 * Usage:
 *   node scripts/vitest-performance-check.mjs
 *   node scripts/vitest-performance-check.mjs --baseline benchmarks/vitest-baseline.json
 *   pnpm run test:benchmark:check
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PERFORMANCE_TOLERANCE,
  resolveMaxWorkers,
  runtimeSettingsSnapshot,
} from "./vitest-runtime-settings.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, "..");
const vitestBin = path.join(repoRoot, "node_modules", ".bin", "vitest");

const DURATION_RE =
  /Duration\s+([\d.]+)s\s+\(transform\s+([\d.]+)s,\s+setup\s+([\d.]+)s,\s+import\s+([\d.]+)s,\s+tests\s+([\d.]+)s,\s+environment\s+([\d.]+)s\)/;
const SUMMARY_RE = /Test Files\s+(.+?)\s*\n\s*Tests\s+(.+?)(?:\s*\n|$)/s;

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const opts = {
    baselinePath: path.join(repoRoot, "benchmarks", "vitest-baseline.json"),
    reportPath: path.join(repoRoot, "benchmarks", "vitest-performance-report.json"),
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--baseline" && argv[i + 1]) {
      opts.baselinePath = path.resolve(argv[++i]);
    } else if (argv[i] === "--report" && argv[i + 1]) {
      opts.reportPath = path.resolve(argv[++i]);
    } else if (argv[i] === "--dry-run") {
      opts.dryRun = true;
    }
  }

  return opts;
}

/**
 * @param {string} stdout
 * @param {string} stderr
 * @param {number} wallMs
 */
function parseVitestOutput(stdout, stderr, wallMs) {
  const combined = `${stdout}\n${stderr}`;
  const durationMatch = combined.match(DURATION_RE);
  const summaryMatch = combined.match(SUMMARY_RE);

  let timingBreakdownSec = null;
  if (durationMatch) {
    timingBreakdownSec = {
      total: Number.parseFloat(durationMatch[1]),
      transform: Number.parseFloat(durationMatch[2]),
      setup: Number.parseFloat(durationMatch[3]),
      import: Number.parseFloat(durationMatch[4]),
      tests: Number.parseFloat(durationMatch[5]),
      environment: Number.parseFloat(durationMatch[6]),
    };
  }

  let success = true;
  if (summaryMatch) {
    const testFiles = summaryMatch[1].trim();
    const tests = summaryMatch[2].trim();
    success = !(testFiles.includes("failed") || tests.includes("failed"));
  }

  return { timingBreakdownSec, success, wallMs };
}

/**
 * @returns {{ wallMs: number, timingBreakdownSec: Record<string, number> | null, success: boolean }}
 */
function runWarmWorkspaceCheck() {
  const startedAt = Date.now();
  const result = spawnSync(vitestBin, ["run", "--no-color"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "",
      GITHUB_ACTIONS: "",
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  const wallMs = Date.now() - startedAt;
  const parsed = parseVitestOutput(result.stdout ?? "", result.stderr ?? "", wallMs);

  return {
    wallMs,
    timingBreakdownSec: parsed.timingBreakdownSec,
    success: parsed.success && result.status === 0,
    exitCode: result.status ?? 1,
  };
}

/**
 * @param {number} current
 * @param {number} baseline
 * @param {number} tolerance
 */
function compareMetric(current, baseline, tolerance) {
  const ratio = baseline > 0 ? current / baseline : 1;
  return {
    current,
    baseline,
    ratio: Math.round(ratio * 1000) / 1000,
    tolerance,
    withinTolerance: ratio <= tolerance,
  };
}

/**
 * @param {Record<string, unknown>} baseline
 * @param {{ wallMs: number, timingBreakdownSec: Record<string, number> | null, success: boolean }} current
 */
export function evaluatePerformanceRegression(baseline, current) {
  const baselineWarm = baseline.workspace?.test?.warm;
  if (!baselineWarm) {
    throw new Error("Baseline is missing workspace.test.warm measurements.");
  }

  const baselineWall = baselineWarm.wallMs?.median;
  const baselineEnvironment = baselineWarm.timingBreakdownSec?.environment;

  if (typeof baselineWall !== "number") {
    throw new Error("Baseline warm wallMs median is missing.");
  }

  const comparisons = {
    wallMs: compareMetric(current.wallMs, baselineWall, PERFORMANCE_TOLERANCE.wallMs),
  };

  if (
    typeof baselineEnvironment === "number" &&
    current.timingBreakdownSec &&
    typeof current.timingBreakdownSec.environment === "number"
  ) {
    comparisons.environmentSec = compareMetric(
      current.timingBreakdownSec.environment,
      baselineEnvironment,
      PERFORMANCE_TOLERANCE.environmentSec
    );
  }

  const warnings = [];
  const failures = [];

  if (!current.success) {
    failures.push("Vitest run reported test failures.");
  }

  if (!comparisons.wallMs.withinTolerance) {
    const message = `Wall time regression: ${current.wallMs}ms vs baseline ${baselineWall}ms (${comparisons.wallMs.ratio}x)`;
    if (comparisons.wallMs.ratio >= PERFORMANCE_TOLERANCE.severeWallMs) {
      failures.push(message);
    } else {
      warnings.push(message);
    }
  }

  if (comparisons.environmentSec && !comparisons.environmentSec.withinTolerance) {
    warnings.push(
      `Environment phase regression: ${comparisons.environmentSec.current}s vs baseline ${comparisons.environmentSec.baseline}s (${comparisons.environmentSec.ratio}x)`
    );
  }

  return {
    status: failures.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass",
    comparisons,
    warnings,
    failures,
    tolerance: PERFORMANCE_TOLERANCE,
  };
}

/**
 * @param {ReturnType<typeof evaluatePerformanceRegression>} evaluation
 */
function renderReport(evaluation) {
  const lines = [
    "# Vitest performance check",
    "",
    `Status: **${evaluation.status}**`,
    "",
    "## Comparisons",
    "",
    `| Metric | Current | Baseline | Ratio | Tolerance |`,
    `| --- | ---: | ---: | ---: | ---: |`,
  ];

  const wall = evaluation.comparisons.wallMs;
  lines.push(
    `| Wall (ms) | ${wall.current} | ${wall.baseline} | ${wall.ratio}x | ${wall.tolerance}x |`
  );

  if (evaluation.comparisons.environmentSec) {
    const env = evaluation.comparisons.environmentSec;
    lines.push(
      `| Environment (s) | ${env.current} | ${env.baseline} | ${env.ratio}x | ${env.tolerance}x |`
    );
  }

  if (evaluation.warnings.length > 0) {
    lines.push("", "## Warnings", "");
    for (const warning of evaluation.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (evaluation.failures.length > 0) {
    lines.push("", "## Failures", "");
    for (const failure of evaluation.failures) {
      lines.push(`- ${failure}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!existsSync(opts.baselinePath)) {
    console.error(`Missing baseline: ${opts.baselinePath}`);
    console.error("Run pnpm run test:benchmark first.");
    process.exit(2);
  }

  const baseline = JSON.parse(readFileSync(opts.baselinePath, "utf8"));

  if (opts.dryRun) {
    const evaluation = evaluatePerformanceRegression(baseline, {
      wallMs: baseline.workspace.test.warm.wallMs.median,
      timingBreakdownSec: baseline.workspace.test.warm.timingBreakdownSec,
      success: true,
    });
    console.log(renderReport(evaluation));
    process.exit(evaluation.status === "fail" ? 1 : 0);
  }

  console.log("Running warm Vitest workspace check...");
  const current = runWarmWorkspaceCheck();
  const evaluation = evaluatePerformanceRegression(baseline, current);

  const report = {
    schemaVersion: 1,
    issue: "ALP-135",
    capturedAt: new Date().toISOString(),
    runtime: runtimeSettingsSnapshot(),
    maxWorkers: resolveMaxWorkers(),
    current,
    evaluation,
    markdown: renderReport(evaluation),
  };

  writeFileSync(opts.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(renderReport(evaluation));
  console.log(`Report JSON: ${opts.reportPath}`);

  if (evaluation.status === "fail") {
    process.exit(1);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
