#!/usr/bin/env node
/**
 * @fileoverview Reads Vitest V8 JSON coverage and produces a machine-readable
 * debt report: global metrics, per-package breakdown, ranked uncovered files,
 * and packages below the configured floor.
 *
 * Usage:
 *   node scripts/coverage-report.mjs [--baseline <file>] [--floor <percent>] [--write-summary]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, "..");
const COVERAGE_DIR = path.resolve(repoRoot, "coverage");
const COVERAGE_JSON = path.join(COVERAGE_DIR, "coverage-summary.json");
const DEFAULT_FLOOR = 85;
const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    baseline: null,
    floor: DEFAULT_FLOOR,
    writeSummary: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--baseline" && args[i + 1]) {
      opts.baseline = args[++i];
    } else if (args[i] === "--floor" && args[i + 1]) {
      opts.floor = Number.parseFloat(args[++i]);
    } else if (args[i] === "--write-summary") {
      opts.writeSummary = true;
    }
  }

  return opts;
}

function readCoverageJson(filePath) {
  if (!existsSync(filePath)) {
    console.error(`Coverage file not found: ${filePath}`);
    console.error("Run 'pnpm test:coverage' first to generate coverage data.");
    process.exit(1);
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!data.total || typeof data.total !== "object") {
      console.error("Malformed coverage JSON: missing 'total' section");
      process.exit(1);
    }

    for (const metric of ["lines", "statements", "functions", "branches"]) {
      if (!data.total[metric]) {
        console.error(`Malformed coverage JSON: missing 'total.${metric}'`);
        process.exit(1);
      }
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`Malformed coverage JSON: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

function extractGlobal(coverageData) {
  const t = coverageData.total;
  return {
    lines: pct(t.lines),
    statements: pct(t.statements),
    functions: pct(t.functions),
    branches: pct(t.branches),
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: report aggregator handles many packages and file roles
function extractPackageData(coverageData) {
  /** @type {Map<string, { lines: number, totalLines: number, statements: number, totalStatements: number, functions: number, totalFunctions: number, branches: number, totalBranches: number, files: Array<{ path: string, lines: number, statements: number, functions: number, branches: number, uncoveredLines: number, uncoveredBranches: number }> }>} */
  const packages = new Map();

  for (const [filePath, fileData] of Object.entries(coverageData)) {
    if (filePath === "total") {
      continue;
    }

    const normalized = normalizePath(filePath);
    const pkgMatch = normalized.match(/packages\/([^/]+)\//);
    if (!pkgMatch) {
      continue;
    }

    const pkgName = pkgMatch[1];
    if (!packages.has(pkgName)) {
      packages.set(pkgName, {
        lines: 0,
        totalLines: 0,
        statements: 0,
        totalStatements: 0,
        functions: 0,
        totalFunctions: 0,
        branches: 0,
        totalBranches: 0,
        files: [],
      });
    }

    const pkg = packages.get(pkgName);
    const f = fileData;

    const fileLines = f.lines?.pct ?? 0;
    const fileStatements = f.statements?.pct ?? 0;
    const fileFunctions = f.functions?.pct ?? 0;
    const fileBranches = f.branches?.pct ?? 0;

    const uncoveredLines = (f.lines?.total ?? 0) - (f.lines?.covered ?? 0);
    const uncoveredBranches = (f.branches?.total ?? 0) - (f.branches?.covered ?? 0);

    pkg.lines += f.lines?.covered ?? 0;
    pkg.totalLines += f.lines?.total ?? 0;
    pkg.statements += f.statements?.covered ?? 0;
    pkg.totalStatements += f.statements?.total ?? 0;
    pkg.functions += f.functions?.covered ?? 0;
    pkg.totalFunctions += f.functions?.total ?? 0;
    pkg.branches += f.branches?.covered ?? 0;
    pkg.totalBranches += f.branches?.total ?? 0;

    pkg.files.push({
      path: normalized,
      lines: fileLines,
      statements: fileStatements,
      functions: fileFunctions,
      branches: fileBranches,
      uncoveredLines,
      uncoveredBranches,
    });
  }

  // Sort files in each package by uncovered lines descending
  for (const pkg of packages.values()) {
    pkg.files.sort((a, b) => b.uncoveredLines - a.uncoveredLines);
  }

  return packages;
}

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

function pct(stat) {
  if (!stat || stat.total === 0) {
    return 100;
  }
  return Number(((stat.covered / stat.total) * 100).toFixed(2));
}

function pctOf(covered, total) {
  if (total === 0) {
    return 100;
  }
  return Number(((covered / total) * 100).toFixed(2));
}

function formatMetric(value) {
  return `${value.toFixed(2)}%`;
}

function diffFromBaseline(current, baseline) {
  if (!baseline) {
    return "";
  }
  const d = current - baseline;
  const sign = d >= 0 ? "+" : "";
  return ` (${sign}${d.toFixed(2)}%)`;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: report orchestration handles table, summary, and GitHub output in one pass
function generateReport(coverageData, opts) {
  const global = extractGlobal(coverageData);
  const packages = extractPackageData(coverageData);

  let baseline = null;
  if (opts.baseline && existsSync(opts.baseline)) {
    try {
      baseline = JSON.parse(readFileSync(opts.baseline, "utf-8"));
    } catch {
      console.warn(`Warning: could not parse baseline file ${opts.baseline}`);
    }
  }

  const lines = [];

  lines.push("# Coverage Report");
  lines.push("");

  // Global metrics
  lines.push("## Global Metrics");
  lines.push("");
  lines.push("| Metric | Coverage | Threshold | Status |");
  lines.push("|--------|----------|-----------|--------|");

  for (const [metric, value] of Object.entries(global)) {
    const threshold = opts.writeSummary ? 90 : 80;
    const status = value >= threshold ? "PASS" : "FAIL";
    const diff =
      baseline?.global?.[metric] != null ? diffFromBaseline(value, baseline.global[metric]) : "";
    lines.push(
      `| ${capitalize(metric)} | ${formatMetric(value)}${diff} | ${threshold}% | ${status} |`
    );
  }

  lines.push("");

  // Package breakdown
  lines.push("## Per-Package Coverage");
  lines.push("");
  lines.push("| Package | Lines | Branches | Functions | Statements | Status |");
  lines.push("|---------|-------|----------|-----------|------------|--------|");

  const sortedPackages = [...packages.entries()].sort((a, b) => {
    const aMin = Math.min(
      pctOf(a[1].lines, a[1].totalLines),
      pctOf(a[1].branches, a[1].totalBranches)
    );
    const bMin = Math.min(
      pctOf(b[1].lines, b[1].totalLines),
      pctOf(b[1].branches, b[1].totalBranches)
    );
    return aMin - bMin;
  });

  const belowFloor = [];

  for (const [name, data] of sortedPackages) {
    const linesPct = pctOf(data.lines, data.totalLines);
    const branchesPct = pctOf(data.branches, data.totalBranches);
    const functionsPct = pctOf(data.functions, data.totalFunctions);
    const statementsPct = pctOf(data.statements, data.totalStatements);
    const minMetric = Math.min(linesPct, branchesPct, functionsPct, statementsPct);
    const status = minMetric >= opts.floor ? "OK" : "BELOW FLOOR";

    if (minMetric < opts.floor) {
      belowFloor.push({ name, min: minMetric });
    }

    lines.push(
      `| ${name} | ${formatMetric(linesPct)} | ${formatMetric(branchesPct)} | ${formatMetric(functionsPct)} | ${formatMetric(statementsPct)} | ${status} |`
    );
  }

  lines.push("");

  // Below floor warning
  if (belowFloor.length > 0) {
    lines.push("## Packages Below Floor");
    lines.push("");
    for (const pkg of belowFloor) {
      lines.push(`- **${pkg.name}**: ${formatMetric(pkg.min)}`);
    }
    lines.push("");
  }

  // Ranked uncovered files by lines
  const allFiles = [...packages.values()].flatMap((p) => p.files);
  allFiles.sort((a, b) => b.uncoveredLines - a.uncoveredLines);

  lines.push("## Top Uncovered Files (by absolute uncovered lines)");
  lines.push("");
  lines.push("| Rank | File | Uncovered Lines | Uncovered Branches | Coverage |");
  lines.push("|------|------|-----------------|--------------------|----------|");

  const topByLines = allFiles.filter((f) => f.uncoveredLines > 0).slice(0, 20);
  for (let i = 0; i < topByLines.length; i++) {
    const f = topByLines[i];
    const shortPath = f.path.replace(/.*\/packages\//, "");
    lines.push(
      `| ${i + 1} | ${shortPath} | ${f.uncoveredLines} | ${f.uncoveredBranches} | ${formatMetric(f.lines)} |`
    );
  }

  lines.push("");

  // Ranked uncovered files by branches
  const allFilesByBranch = [...allFiles].sort((a, b) => b.uncoveredBranches - a.uncoveredBranches);

  lines.push("## Top Uncovered Files (by absolute uncovered branches)");
  lines.push("");
  lines.push("| Rank | File | Uncovered Branches | Uncovered Lines | Coverage |");
  lines.push("|------|------|--------------------|-----------------|----------|");

  const topByBranches = allFilesByBranch.filter((f) => f.uncoveredBranches > 0).slice(0, 20);
  for (let i = 0; i < topByBranches.length; i++) {
    const f = topByBranches[i];
    const shortPath = f.path.replace(/.*\/packages\//, "");
    lines.push(
      `| ${i + 1} | ${shortPath} | ${f.uncoveredBranches} | ${f.uncoveredLines} | ${formatMetric(f.branches)} |`
    );
  }

  lines.push("");

  return { text: lines.join("\n"), global, packages: sortedPackages, belowFloor, allFiles };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildMachineReadable(analysis) {
  const global = analysis.global;
  const packageMetrics = {};

  for (const [name, data] of analysis.packages) {
    packageMetrics[name] = {
      lines: pctOf(data.lines, data.totalLines),
      branches: pctOf(data.branches, data.totalBranches),
      functions: pctOf(data.functions, data.totalFunctions),
      statements: pctOf(data.statements, data.totalStatements),
    };
  }

  return {
    global,
    packages: packageMetrics,
    belowFloor: analysis.belowFloor.map((p) => p.name),
    topUncoveredByLines: analysis.allFiles
      .filter((f) => f.uncoveredLines > 0)
      .slice(0, 30)
      .map((f) => ({
        file: f.path.replace(/.*\/packages\//, ""),
        uncoveredLines: f.uncoveredLines,
        uncoveredBranches: f.uncoveredBranches,
        linesPct: f.lines,
        branchesPct: f.branches,
      })),
    topUncoveredByBranches: [...analysis.allFiles]
      .filter((f) => f.uncoveredBranches > 0)
      .sort((a, b) => b.uncoveredBranches - a.uncoveredBranches)
      .slice(0, 30)
      .map((f) => ({
        file: f.path.replace(/.*\/packages\//, ""),
        uncoveredBranches: f.uncoveredBranches,
        uncoveredLines: f.uncoveredLines,
        branchesPct: f.branches,
        linesPct: f.lines,
      })),
  };
}

// Main
const opts = parseArgs();
const coverageData = readCoverageJson(COVERAGE_JSON);
const analysis = generateReport(coverageData, opts);

// Print to terminal
console.log(analysis.text);

// Write machine-readable report
const machineReport = buildMachineReadable(analysis);
const reportPath = path.join(COVERAGE_DIR, "coverage-report.json");
mkdirSync(COVERAGE_DIR, { recursive: true });
writeFileSync(reportPath, JSON.stringify(machineReport, null, 2));
console.log(`\nMachine-readable report written to: ${reportPath}`);

// Write GitHub Step Summary if requested
if (opts.writeSummary && SUMMARY_FILE) {
  writeFileSync(SUMMARY_FILE, analysis.text);
  console.log(`GitHub Step Summary written to: ${SUMMARY_FILE}`);
}

// Exit non-zero if any package is below floor
if (analysis.belowFloor.length > 0) {
  console.error(
    `\n${analysis.belowFloor.length} package(s) below ${opts.floor}% floor: ${analysis.belowFloor.map((p) => p.name).join(", ")}`
  );
  process.exit(1);
}
