#!/usr/bin/env node
/**
 * @fileoverview Captures a reproducible Vitest performance baseline for ALP-128.
 *
 * Measures cold and warm runs for workspace and package-level commands, parses
 * Vitest timing breakdowns, ranks slow files/packages, and writes machine-readable
 * JSON plus a human-readable summary.
 *
 * Usage:
 *   node scripts/vitest-benchmark.mjs [--runs 3] [--output <dir>] [--quick]
 *   pnpm run test:benchmark
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(root, "..");
const vitestBin = path.join(repoRoot, "node_modules", ".bin", "vitest");
const timeBin = "/usr/bin/time";

const DURATION_RE =
  /Duration\s+([\d.]+)s\s+\(transform\s+([\d.]+)s,\s+setup\s+([\d.]+)s,\s+import\s+([\d.]+)s,\s+tests\s+([\d.]+)s,\s+environment\s+([\d.]+)s\)/;
const SUMMARY_RE = /Test Files\s+(.+?)\s*\n\s*Tests\s+(.+?)(?:\s*\n|$)/s;

const WORKSPACE_SCENARIOS = [
  { id: "test", label: "pnpm test", args: ["run"], coverage: false },
  {
    id: "test:coverage",
    label: "pnpm run test:coverage",
    args: ["run", "--coverage"],
    coverage: true,
  },
];

const PACKAGE_SCENARIOS = [
  {
    id: "core",
    label: "@ailuracode/alpine-core",
    category: "pure-controller",
    command: [vitestBin, "run", "--config", "vitest.config.ts", "packages/core"],
    filterNote: "Scoped to packages/core (correct).",
  },
  {
    id: "dialog",
    label: "@ailuracode/alpine-dialog",
    category: "dom-heavy",
    command: [vitestBin, "run", "--config", "vitest.config.ts", "packages/dialog"],
    filterNote: "Scoped to packages/dialog (package script contract).",
  },
  {
    id: "query",
    label: "@ailuracode/alpine-query",
    category: "async-cache",
    command: [vitestBin, "run", "--config", "vitest.config.ts", "packages/query"],
    filterNote: "Scoped to packages/query (package script contract).",
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    runs: 3,
    outputDir: path.join(repoRoot, "benchmarks"),
    quick: false,
    skipPackages: false,
    skipWorkspace: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--runs" && args[i + 1]) {
      opts.runs = Number.parseInt(args[++i], 10);
    } else if (args[i] === "--output" && args[i + 1]) {
      opts.outputDir = path.resolve(args[++i]);
    } else if (args[i] === "--quick") {
      opts.quick = true;
    } else if (args[i] === "--skip-packages") {
      opts.skipPackages = true;
    } else if (args[i] === "--skip-workspace") {
      opts.skipWorkspace = true;
    }
  }

  return opts;
}

function readPackageVersion(name) {
  const pkgPath = path.join(repoRoot, "node_modules", name, "package.json");
  if (!existsSync(pkgPath)) {
    return "unknown";
  }

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  return typeof pkg.version === "string" ? pkg.version : "unknown";
}

function median(values) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function roundMs(value) {
  return Math.round(value * 1000) / 1000;
}

function roundSec(value) {
  return Math.round(value * 100) / 100;
}

function summarizeRuns(runs) {
  const wallMs = runs.map((run) => run.wallMs);
  const maxRssKb = runs.map((run) => run.maxRssKb);
  const compactRuns = runs.map((run, index) => {
    if (index === 0) {
      return run;
    }

    const { slowestFiles: _slowestFiles, packageTotals: _packageTotals, ...rest } = run;
    return rest;
  });

  return {
    count: runs.length,
    wallMs: {
      min: Math.min(...wallMs),
      median: roundMs(median(wallMs)),
      max: Math.max(...wallMs),
    },
    maxRssKb: {
      min: Math.min(...maxRssKb),
      median: Math.round(median(maxRssKb)),
      max: Math.max(...maxRssKb),
    },
    timingBreakdownSec: averageTimingBreakdown(runs),
    success: runs.every((run) => run.success),
    runs: compactRuns,
  };
}

function averageTimingBreakdown(runs) {
  const keys = ["total", "transform", "setup", "import", "tests", "environment"];
  const totals = Object.fromEntries(keys.map((key) => [key, 0]));
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));

  for (const run of runs) {
    for (const key of keys) {
      const value = run.timingBreakdownSec[key];
      if (typeof value === "number") {
        totals[key] += value;
        counts[key] += 1;
      }
    }
  }

  return Object.fromEntries(
    keys.map((key) => [key, counts[key] > 0 ? roundSec(totals[key] / counts[key]) : null])
  );
}

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
  } else if (wallMs !== undefined) {
    timingBreakdownSec = {
      total: roundSec(wallMs / 1000),
      transform: null,
      setup: null,
      import: null,
      tests: null,
      environment: null,
      note: "Vitest did not emit a duration breakdown; total approximated from wall clock.",
    };
  } else {
    throw new Error("Could not parse Vitest duration breakdown from output.");
  }

  let testFiles = null;
  let tests = null;
  let success = true;

  if (summaryMatch) {
    testFiles = summaryMatch[1].trim();
    tests = summaryMatch[2].trim();
    success = !(testFiles.includes("failed") || tests.includes("failed"));
  }

  return { timingBreakdownSec, testFiles, tests, success };
}

function analyzeJsonReport(reportPath) {
  if (!existsSync(reportPath)) {
    return { slowestFiles: [], packageTotals: [] };
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const fileDurations = [];

  for (const fileResult of report.testResults ?? []) {
    const start = fileResult.startTime ?? 0;
    const end = fileResult.endTime ?? start;
    const durationMs = Math.max(0, end - start);
    const testCount = fileResult.assertionResults?.length ?? 0;
    const relativePath = String(fileResult.name ?? "")
      .replace(`${repoRoot}/`, "")
      .replaceAll("\\", "/");

    fileDurations.push({
      file: relativePath,
      durationMs: roundMs(durationMs),
      testCount,
      package: packageFromPath(relativePath),
    });
  }

  fileDurations.sort((a, b) => b.durationMs - a.durationMs);

  const packageMap = new Map();
  for (const entry of fileDurations) {
    const pkg = entry.package;
    const current = packageMap.get(pkg) ?? {
      package: pkg,
      durationMs: 0,
      fileCount: 0,
      testCount: 0,
    };
    current.durationMs += entry.durationMs;
    current.fileCount += 1;
    current.testCount += entry.testCount;
    packageMap.set(pkg, current);
  }

  const packageTotals = [...packageMap.values()]
    .map((entry) => ({
      ...entry,
      durationMs: roundMs(entry.durationMs),
    }))
    .sort((a, b) => b.durationMs - a.durationMs);

  return {
    slowestFiles: fileDurations.slice(0, 25),
    packageTotals: packageTotals.slice(0, 25),
  };
}

function packageFromPath(relativePath) {
  const match = relativePath.match(/^packages\/([^/]+)/);
  if (match) {
    return match[1];
  }

  if (relativePath.startsWith("test/")) {
    return "repository";
  }

  if (relativePath.startsWith("apps/demo/")) {
    return "demo";
  }

  return "other";
}

function clearVitestCache() {
  spawnSync(vitestBin, ["--clearCache"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runVitest({ args, jsonReportPath, label }) {
  const timeOutputPath = `${jsonReportPath}.time.txt`;
  const vitestArgs = [
    ...args,
    "--no-color",
    "--reporter=default",
    "--reporter=json",
    `--outputFile=${jsonReportPath}`,
  ];

  const command = existsSync(timeBin)
    ? {
        bin: timeBin,
        args: ["-f", "wall=%e maxRss=%M", "-o", timeOutputPath, vitestBin, ...vitestArgs],
      }
    : {
        bin: vitestBin,
        args: vitestArgs,
      };

  const startedAt = Date.now();
  const result = spawnSync(command.bin, command.args, {
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
  const endedAt = Date.now();

  let wallMs = endedAt - startedAt;
  let maxRssKb = null;

  if (existsSync(timeOutputPath)) {
    const timeText = readFileSync(timeOutputPath, "utf8").trim();
    const wallMatch = timeText.match(/wall=([\d.]+)/);
    const rssMatch = timeText.match(/maxRss=(\d+)/);
    if (wallMatch) {
      wallMs = roundMs(Number.parseFloat(wallMatch[1]) * 1000);
    }
    if (rssMatch) {
      maxRssKb = Number.parseInt(rssMatch[1], 10);
    }
    unlinkSync(timeOutputPath);
  }

  const parsed = parseVitestOutput(result.stdout ?? "", result.stderr ?? "", wallMs);
  const analysis = analyzeJsonReport(jsonReportPath);

  if (existsSync(jsonReportPath)) {
    unlinkSync(jsonReportPath);
  }

  return {
    label,
    wallMs,
    maxRssKb,
    exitCode: result.status ?? 1,
    success: parsed.success && result.status === 0,
    timingBreakdownSec: parsed.timingBreakdownSec,
    testFiles: parsed.testFiles,
    tests: parsed.tests,
    slowestFiles: analysis.slowestFiles.slice(0, 10),
    packageTotals: analysis.packageTotals.slice(0, 10),
  };
}

function runScenarioGroup({ id, label, args, runs, tempDir, mode }) {
  const groupRuns = [];

  for (let index = 0; index < runs; index++) {
    if (mode === "cold") {
      clearVitestCache();
    }

    const jsonReportPath = path.join(tempDir, `${id}-${mode}-${index + 1}.json`);
    console.log(`  [${mode}] run ${index + 1}/${runs}: ${label}`);

    groupRuns.push(
      runVitest({
        args,
        jsonReportPath,
        label,
      })
    );
  }

  return summarizeRuns(groupRuns);
}

function collectInventory() {
  const listResult = spawnSync(vitestBin, ["list", "--filesOnly"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const files = (listResult.stdout ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const jsonListResult = spawnSync(vitestBin, ["list", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  let testCount = null;
  try {
    const entries = JSON.parse(jsonListResult.stdout ?? "[]");
    testCount = Array.isArray(entries) ? entries.length : null;
  } catch {
    testCount = null;
  }

  return {
    fileCount: files.length,
    testCount,
  };
}

function buildOptimizationTargets(baseline) {
  const targets = [];
  const workspaceTest = baseline.workspace.test.warm;
  const breakdown = workspaceTest.timingBreakdownSec;

  const breakdownEntries = [
    ["environment", breakdown.environment],
    ["tests", breakdown.tests],
    ["import", breakdown.import],
    ["transform", breakdown.transform],
    ["setup", breakdown.setup],
  ]
    .filter((entry) => typeof entry[1] === "number")
    .sort((a, b) => b[1] - a[1]);

  for (const [phase, seconds] of breakdownEntries.slice(0, 3)) {
    targets.push({
      rank: targets.length + 1,
      area: `workspace ${phase}`,
      metric:
        `${seconds}s median warm ${breakdownEntries[0][0] === phase ? "(largest phase)" : ""}`.trim(),
      rationale: `Global happy-dom environment and setup apply to every file; ${phase} dominates non-coverage runs.`,
      epic: "ALP-127",
    });
  }

  for (const pkg of baseline.packages) {
    if (pkg.id === "dialog" || pkg.id === "query") {
      const warm = pkg.warm;
      targets.push({
        rank: targets.length + 1,
        area: `${pkg.label} package script`,
        metric: `${warm.wallMs.median}ms median warm`,
        rationale: pkg.filterNote,
        epic: "ALP-127",
      });
    }
  }

  const slowPackages = baseline.workspace.test.warm.runs[0]?.packageTotals ?? [];
  for (const entry of slowPackages.slice(0, 5)) {
    targets.push({
      rank: targets.length + 1,
      area: `package:${entry.package}`,
      metric: `${entry.durationMs}ms aggregated file time`,
      rationale: `${entry.fileCount} files / ${entry.testCount} tests in warm workspace run.`,
      epic: "ALP-127",
    });
  }

  const slowFiles = baseline.workspace.test.warm.runs[0]?.slowestFiles ?? [];
  for (const entry of slowFiles.slice(0, 5)) {
    targets.push({
      rank: targets.length + 1,
      area: entry.file,
      metric: `${entry.durationMs}ms file duration`,
      rationale: "Slowest individual test file in warm workspace run.",
      epic: "ALP-127",
    });
  }

  return targets
    .sort((a, b) => a.rank - b.rank)
    .map((target, index) => ({ ...target, rank: index + 1 }));
}

function renderMarkdown(baseline) {
  const lines = [
    "# Vitest performance baseline",
    "",
    "Baseline for [ALP-128](https://linear.app/ailuracode/issue/ALP-128/establish-a-reproducible-vitest-performance-baseline) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).",
    "",
    "## How to reproduce",
    "",
    "```bash",
    "pnpm run test:benchmark",
    "```",
    "",
    "Options:",
    "",
    "- `--runs <n>` — repetitions per cold/warm group (default: 3)",
    "- `--quick` — workspace scenarios only (skip package runs)",
    "- `--skip-workspace` — reuse workspace measurements from an existing baseline JSON",
    "- `--output <dir>` — output directory (default: `benchmarks/`)",
    "",
    "## Environment",
    "",
    `- Captured: ${baseline.capturedAt}`,
    `- Node: ${baseline.environment.nodeVersion}`,
    `- Platform: ${baseline.environment.platform}`,
    `- CPUs: ${baseline.environment.cpuCount}`,
    `- Vitest: ${baseline.environment.vitestVersion}`,
    `- Default pool: forks (Vitest default)`,
    "",
    "## Inventory",
    "",
    `- Test files: ${baseline.inventory.fileCount}`,
    `- Listed tests: ${baseline.inventory.testCount ?? "n/a"}`,
    "",
    "## Workspace commands",
    "",
    "| Command | Mode | Median wall | Median RSS | Transform | Setup | Import | Tests | Environment |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const scenario of WORKSPACE_SCENARIOS) {
    for (const mode of ["cold", "warm"]) {
      const summary = baseline.workspace[scenario.id][mode];
      const timing = summary.timingBreakdownSec;
      const fmt = (value) => (typeof value === "number" ? `${value}s` : "n/a");
      lines.push(
        `| \`${scenario.label}\` | ${mode} | ${summary.wallMs.median}ms | ${summary.maxRssKb.median}KB | ${fmt(timing.transform)} | ${fmt(timing.setup)} | ${fmt(timing.import)} | ${fmt(timing.tests)} | ${fmt(timing.environment)} |`
      );
    }
  }

  lines.push("", "## Package-level commands", "");
  lines.push(
    "| Package | Category | Mode | Median wall | Files summary | Note |",
    "| --- | --- | --- | ---: | --- | --- |"
  );

  for (const pkg of baseline.packages) {
    for (const mode of ["cold", "warm"]) {
      const summary = pkg[mode];
      const sample = summary.runs[0];
      const inherited = summary.inherited ? " (inherits workspace test)" : "";
      const filesSummary = (sample?.testFiles ?? "n/a").replaceAll("|", "/");
      lines.push(
        `| ${pkg.label} | ${pkg.category} | ${mode} | ${summary.wallMs.median}ms | ${filesSummary} | ${pkg.filterNote}${inherited} |`
      );
    }
  }

  lines.push("", "## Ranked optimization targets", "");

  for (const target of baseline.optimizationTargets.slice(0, 15)) {
    lines.push(`${target.rank}. **${target.area}** — ${target.metric}. ${target.rationale}`);
  }

  lines.push(
    "",
    "## CI reference",
    "",
    baseline.ci.note,
    "",
    `- Full coverage (run \`29303074025\`): **${baseline.ci.fullCoverageMinutes} min**`,
    `- Affected tests (run \`29362602048\`): **${baseline.ci.affectedTestsMinutes} min**`,
    "",
    "Update `benchmarks/vitest-baseline.json` after refreshing local baselines. Compare future runs with:",
    "",
    "```bash",
    "node scripts/vitest-benchmark.mjs --runs 3",
    "```",
    ""
  );

  return `${lines.join("\n")}\n`;
}

function loadExistingWorkspace(outputDir) {
  const jsonPath = path.join(outputDir, "vitest-baseline.json");
  if (!existsSync(jsonPath)) {
    throw new Error(`--skip-workspace requires an existing baseline at ${jsonPath}`);
  }

  const existing = JSON.parse(readFileSync(jsonPath, "utf8"));
  if (!existing.workspace) {
    throw new Error("Existing baseline is missing workspace measurements.");
  }

  return existing.workspace;
}

function main() {
  const opts = parseArgs();
  mkdirSync(opts.outputDir, { recursive: true });

  const tempDir = path.join(opts.outputDir, ".tmp");
  mkdirSync(tempDir, { recursive: true });

  console.log("Collecting Vitest inventory...");
  const inventory = collectInventory();

  const baseline = {
    schemaVersion: 1,
    issue: "ALP-128",
    epic: "ALP-127",
    capturedAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: `${process.platform} ${os.release()}`,
      cpuCount: os.cpus().length,
      vitestVersion: readPackageVersion("vitest"),
      defaultEnvironment: "happy-dom",
      setupFiles: ["test/setup.ts"],
    },
    inventory,
    workspace: {},
    packages: [],
    ci: {
      note: "Representative GitHub Actions timings from workflow runs on ubuntu-latest (Node 22).",
      references: [
        {
          workflowRunId: 29303074025,
          event: "schedule",
          step: "Run tests with coverage",
          durationSeconds: 69,
        },
        {
          workflowRunId: 29362602048,
          event: "pull_request",
          step: "Run affected tests",
          durationSeconds: 62,
        },
      ],
      fullCoverageMinutes: 1.15,
      affectedTestsMinutes: 1.03,
    },
    optimizationTargets: [],
  };

  for (const scenario of WORKSPACE_SCENARIOS) {
    if (opts.skipWorkspace) {
      continue;
    }

    console.log(`\nBenchmarking ${scenario.label}...`);
    baseline.workspace[scenario.id] = {
      label: scenario.label,
      cold: runScenarioGroup({
        id: scenario.id,
        label: scenario.label,
        args: scenario.args,
        runs: opts.runs,
        tempDir,
        mode: "cold",
      }),
      warm: runScenarioGroup({
        id: scenario.id,
        label: scenario.label,
        args: scenario.args,
        runs: opts.runs,
        tempDir,
        mode: "warm",
      }),
    };
  }

  if (opts.skipWorkspace) {
    baseline.workspace = loadExistingWorkspace(opts.outputDir);
    baseline.capturedAt = new Date().toISOString();
  }

  if (!(opts.quick || opts.skipPackages)) {
    for (const pkg of PACKAGE_SCENARIOS) {
      console.log(`\nBenchmarking ${pkg.label}...`);

      const entry = {
        id: pkg.id,
        label: pkg.label,
        category: pkg.category,
        filterNote: pkg.filterNote,
      };

      if (pkg.inheritsWorkspace) {
        const inherited = baseline.workspace[pkg.inheritsWorkspace];
        entry.inheritsWorkspace = pkg.inheritsWorkspace;
        entry.cold = { ...inherited.cold, inherited: true };
        entry.warm = { ...inherited.warm, inherited: true };
        baseline.packages.push(entry);
        continue;
      }

      entry.cold = runScenarioGroup({
        id: pkg.id,
        label: pkg.label,
        args: pkg.command.slice(1),
        runs: opts.runs,
        tempDir,
        mode: "cold",
      });
      entry.warm = runScenarioGroup({
        id: pkg.id,
        label: pkg.label,
        args: pkg.command.slice(1),
        runs: opts.runs,
        tempDir,
        mode: "warm",
      });
      baseline.packages.push(entry);
    }
  }

  baseline.optimizationTargets = buildOptimizationTargets(baseline);

  const jsonPath = path.join(opts.outputDir, "vitest-baseline.json");
  const mdPath = path.join(opts.outputDir, "vitest-performance-baseline.md");
  writeFileSync(jsonPath, `${JSON.stringify(baseline, null, 2)}\n`);
  writeFileSync(mdPath, renderMarkdown(baseline));

  rmSync(tempDir, { recursive: true, force: true });

  console.log(`\nBaseline JSON: ${jsonPath}`);
  console.log(`Baseline doc:  ${mdPath}`);
}

main();
