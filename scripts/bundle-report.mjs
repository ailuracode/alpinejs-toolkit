#!/usr/bin/env node

/**
 * Reproducible consumer bundle report using esbuild.
 *
 * Records per publishable package:
 * - defaultCold — typical root import with toolkit/runtime deps, excluding alpinejs + types
 * - intrinsicFull — import * from dist with package-owned code only
 * - subpaths — every JS export subpath (except types-only keys)
 *
 * Usage:
 *   node scripts/bundle-report.mjs [--baseline bundle/baseline.json] [--write-baseline] [--check] [--write-summary]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import {
  BUNDLE_CATEGORY_DEFAULT_COLD_GZIP_BYTES,
  BUNDLE_CATEGORY_INTRINSIC_GZIP_BYTES,
  BUNDLE_REGRESSION_TOLERANCE,
  BUNDLE_REPORT_EXCLUDED,
  DEFAULT_COLD_IMPORT_HINTS,
  TYPE_ONLY_EXTERNALS,
  TYPES_ONLY_EXPORT_SUFFIXES,
} from "./bundle-report-policy.mjs";
import { discoverPackages, publishablePackages, readBundleBudgetMetadata } from "./repo-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const esbuildPath = require.resolve("esbuild", {
  paths: [require.resolve("@size-limit/esbuild")],
});
const { build } = await import(esbuildPath);
const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY;
const DEFAULT_BASELINE = path.join(root, "bundle", "baseline.json");
const REPORT_JSON = path.join(root, "bundle", "report.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    baseline: DEFAULT_BASELINE,
    writeBaseline: false,
    check: false,
    writeSummary: false,
    packages: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--baseline" && args[i + 1]) {
      opts.baseline = path.resolve(args[++i]);
    } else if (args[i] === "--write-baseline") {
      opts.writeBaseline = true;
    } else if (args[i] === "--check") {
      opts.check = true;
    } else if (args[i] === "--write-summary") {
      opts.writeSummary = true;
    } else if (args[i] === "--packages" && args[i + 1]) {
      opts.packages = new Set(
        args[++i]
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      );
    }
  }

  return opts;
}

function isTypeOnlySpecifier(specifier) {
  return TYPE_ONLY_EXTERNALS.includes(specifier) || specifier.startsWith("@types/");
}

function collectIntrinsicExternals(manifest) {
  const externals = new Set(TYPE_ONLY_EXTERNALS);

  for (const section of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
    "devDependencies",
  ]) {
    const deps = manifest[section];
    if (!deps || typeof deps !== "object") {
      continue;
    }

    for (const name of Object.keys(deps)) {
      if (!isTypeOnlySpecifier(name)) {
        externals.add(name);
      }
    }
  }

  return [...externals];
}

function defaultColdSource(packageName, _manifest) {
  const hint = DEFAULT_COLD_IMPORT_HINTS[packageName];
  if (hint) {
    return `import ${hint} from ${JSON.stringify(packageName)};\nexport { ${hint
      .replace(/[{}]/g, "")
      .trim()
      .split(/\s*,\s*/)
      .join(", ")} };\n`;
  }

  return `import entry from ${JSON.stringify(packageName)};\nvoid entry;\n`;
}

function intrinsicFullSource(entryPath) {
  return `import * as surface from ${JSON.stringify(entryPath)};\nexport { surface };\n`;
}

function resolveSubpathEntry(pkg, subpath) {
  const exportTarget = pkg.manifest.exports?.[subpath];
  if (!exportTarget) {
    throw new Error(`${pkg.name}: missing export for ${subpath}`);
  }

  const target =
    typeof exportTarget === "string"
      ? exportTarget
      : exportTarget && typeof exportTarget === "object" && "default" in exportTarget
        ? exportTarget.default
        : null;

  if (!target || typeof target !== "string") {
    throw new Error(`${pkg.name}: export ${subpath} has no JS entry`);
  }

  return path.join(pkg.dir, target.replace(/^\.\//, ""));
}

function subpathSource(entryPath) {
  return `import * as entry from ${JSON.stringify(entryPath)};\nvoid entry;\n`;
}

function compressSizes(bytes) {
  return {
    raw: bytes,
    gzip: gzipSync(bytes).length,
    brotli: brotliCompressSync(bytes, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).length,
  };
}

async function measureBundle({ contents, resolveDir, external, entryPath }) {
  const result = await build({
    stdin: contents
      ? {
          contents,
          loader: "js",
          resolveDir,
        }
      : undefined,
    entryPoints: entryPath ? [entryPath] : undefined,
    bundle: true,
    write: false,
    minify: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    treeShaking: true,
    external,
    logLevel: "silent",
  });

  const file = result.outputFiles[0];
  if (!file) {
    throw new Error("esbuild produced no output");
  }

  return compressSizes(file.contents);
}

function listPerformanceSubpaths(manifest) {
  const exportsField = manifest.exports;
  if (!exportsField || typeof exportsField !== "object") {
    return [];
  }

  const subpaths = [];

  for (const [key, value] of Object.entries(exportsField)) {
    if (key === "." || key === "./package.json") {
      continue;
    }

    if (TYPES_ONLY_EXPORT_SUFFIXES.some((suffix) => key.endsWith(suffix))) {
      continue;
    }

    if (typeof value === "string") {
      subpaths.push(key);
      continue;
    }

    if (value && typeof value === "object" && "default" in value) {
      subpaths.push(key);
    }
  }

  return subpaths.sort();
}

async function measurePackage(pkg) {
  const distEntry = path.join(pkg.dir, "dist", "index.js");
  if (!existsSync(distEntry)) {
    return {
      skipped: true,
      reason: "missing dist/index.js — run pnpm run build first",
    };
  }

  const intrinsicExternals = collectIntrinsicExternals(pkg.manifest);
  const defaultColdExternals = TYPE_ONLY_EXTERNALS.filter((specifier) =>
    isTypeOnlySpecifier(specifier)
  );

  const defaultCold = await measureBundle({
    contents: defaultColdSource(pkg.name, pkg.manifest),
    resolveDir: root,
    external: defaultColdExternals,
  });

  const intrinsicFull = await measureBundle({
    contents: intrinsicFullSource(distEntry),
    resolveDir: path.dirname(distEntry),
    external: intrinsicExternals,
  });

  const subpaths = {};
  for (const subpath of listPerformanceSubpaths(pkg.manifest)) {
    const entryPath = resolveSubpathEntry(pkg, subpath);
    if (!existsSync(entryPath)) {
      continue;
    }

    subpaths[subpath] = await measureBundle({
      contents: subpathSource(entryPath),
      resolveDir: path.dirname(entryPath),
      external: intrinsicExternals,
    });
  }

  return {
    skipped: false,
    defaultCold,
    intrinsicFull,
    subpaths,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(2)} kB`;
}

function formatDelta(current, baseline) {
  const delta = current - baseline;
  const pct = baseline === 0 ? 0 : (delta / baseline) * 100;
  const sign = delta >= 0 ? "+" : "";
  return ` (${sign}${formatBytes(Math.abs(delta))}, ${sign}${pct.toFixed(1)}%)`;
}

function readBaseline(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    console.warn(`Warning: could not parse baseline file ${filePath}`);
    return null;
  }
}

function validateCategoryBudgets(pkg, measurements) {
  const budget = readBundleBudgetMetadata(pkg);
  if (!budget || typeof budget.exclude === "string") {
    return [];
  }

  const category = budget.category;
  const errors = [];

  const intrinsicLimit = BUNDLE_CATEGORY_INTRINSIC_GZIP_BYTES[category];
  if (intrinsicLimit != null && measurements.intrinsicFull.gzip > intrinsicLimit) {
    errors.push(
      `${pkg.name}: intrinsic-full gzip ${formatBytes(measurements.intrinsicFull.gzip)} exceeds ${category} category limit ${formatBytes(intrinsicLimit)}`
    );
  }

  const defaultColdLimit = BUNDLE_CATEGORY_DEFAULT_COLD_GZIP_BYTES[category];
  if (defaultColdLimit != null && measurements.defaultCold.gzip > defaultColdLimit) {
    errors.push(
      `${pkg.name}: default-cold gzip ${formatBytes(measurements.defaultCold.gzip)} exceeds ${category} category limit ${formatBytes(defaultColdLimit)}`
    );
  }

  return errors;
}

function validateRegression(pkgName, current, baselineEntry, label) {
  if (!baselineEntry) {
    return [];
  }

  const errors = [];
  for (const metric of ["gzip", "brotli"]) {
    const previous = baselineEntry[label]?.[metric];
    const next = current[label]?.[metric];
    if (previous == null || next == null) {
      continue;
    }

    const allowed = previous * (1 + BUNDLE_REGRESSION_TOLERANCE);
    if (next > allowed) {
      errors.push(
        `${pkgName}: ${label} ${metric} regressed from ${formatBytes(previous)} to ${formatBytes(next)} (>${(BUNDLE_REGRESSION_TOLERANCE * 100).toFixed(0)}% tolerance)`
      );
    }
  }

  return errors;
}

function buildReportTable(results) {
  const lines = [];
  lines.push("# Bundle report");
  lines.push("");
  lines.push("| Package | Default cold (gzip) | Intrinsic full (gzip) | Subpaths |");
  lines.push("|---------|--------------------:|----------------------:|----------|");

  for (const [name, entry] of Object.entries(results.packages).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    if (entry.skipped) {
      lines.push(`| ${name} | — | — | skipped |`);
      continue;
    }

    const subpathCount = Object.keys(entry.subpaths).length;
    lines.push(
      `| ${name} | ${formatBytes(entry.defaultCold.gzip)} | ${formatBytes(entry.intrinsicFull.gzip)} | ${subpathCount} |`
    );
  }

  lines.push("");
  return lines.join("\n");
}

function buildDeltaSection(results, baseline) {
  if (!baseline?.packages) {
    return "";
  }

  const lines = [
    "## Deltas vs baseline",
    "",
    "| Package | Metric | Current | Baseline | Delta |",
    "|---------|--------|--------:|---------:|------:|",
  ];

  for (const [name, entry] of Object.entries(results.packages)) {
    if (entry.skipped) {
      continue;
    }

    const previous = baseline.packages[name];
    if (!previous) {
      continue;
    }

    for (const label of ["defaultCold", "intrinsicFull"]) {
      const currentGzip = entry[label].gzip;
      const baselineGzip = previous[label]?.gzip;
      if (baselineGzip == null) {
        continue;
      }

      lines.push(
        `| ${name} | ${label} gzip | ${formatBytes(currentGzip)} | ${formatBytes(baselineGzip)} | ${formatDelta(currentGzip, baselineGzip).trim() || "0 B"} |`
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

const opts = parseArgs();
const packagesDir = path.join(root, "packages");
const allPackages = publishablePackages(discoverPackages(packagesDir)).filter(
  (pkg) => !BUNDLE_REPORT_EXCLUDED.includes(pkg.folder)
);
const selectedPackages = opts.packages
  ? allPackages.filter((pkg) => opts.packages.has(pkg.folder) || opts.packages.has(pkg.name))
  : allPackages;

/** @type {Record<string, unknown>} */
const report = {
  generatedAt: new Date().toISOString(),
  packages: {},
};

const errors = [];

for (const pkg of selectedPackages) {
  process.stderr.write(`Measuring ${pkg.name}...\n`);
  const measurements = await measurePackage(pkg);
  report.packages[pkg.name] = measurements;

  if (measurements.skipped) {
    errors.push(`${pkg.name}: ${measurements.reason}`);
    continue;
  }

  if (opts.check) {
    errors.push(...validateCategoryBudgets(pkg, measurements));
  }
}

const baseline = readBaseline(opts.baseline);
if (opts.check && baseline?.packages) {
  for (const [name, entry] of Object.entries(report.packages)) {
    if (entry.skipped) {
      continue;
    }

    errors.push(...validateRegression(name, entry, baseline.packages[name], "defaultCold"));
    errors.push(...validateRegression(name, entry, baseline.packages[name], "intrinsicFull"));
  }
}

mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

const markdown = `${buildReportTable(report)}\n${buildDeltaSection(report, baseline)}`;
console.log(markdown);

if (opts.writeSummary && SUMMARY_FILE) {
  writeFileSync(SUMMARY_FILE, markdown);
}

if (opts.writeBaseline) {
  writeFileSync(opts.baseline, JSON.stringify(report, null, 2));
  console.log(`\nBaseline written to ${opts.baseline}`);
}

console.log(`\nMachine-readable report written to ${REPORT_JSON}`);

if (errors.length > 0) {
  console.error(`\nBundle report failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}
