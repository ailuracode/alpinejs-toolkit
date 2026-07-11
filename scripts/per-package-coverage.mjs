/**
 * Per-package coverage runner (ALP-23).
 *
 * Runs Vitest once per package (each as its own `defineConfig`) so every
 * package is gated by its own ratcheted coverage floor from
 * `scripts/coverage-policy.json`. A weakly tested package can no longer pass
 * CI on the back of coverage from other workspaces.
 *
 * Each package inherits its own `vitest.config.ts` (environment, setup, and
 * local aliases) and layers the shared coverage floor on top. Packages without
 * tests are skipped (the `repo:check` test-existence gate covers that rule).
 *
 * Per-package `defineConfig` is used instead of Vitest "projects" because this
 * Vitest version does not reliably resolve workspace-wide `resolve.alias`
 * entries (e.g. `@ailuracode/alpine-query-adapter-*`) inside project mode —
 * it works correctly in single-config mode, which is also how the original
 * per-package `vitest run --config` scripts resolved imports.
 *
 * Usage:
 *   node scripts/per-package-coverage.mjs            # all packages
 *   node scripts/per-package-coverage.mjs dialog     # single package
 *   node scripts/per-package-coverage.mjs --threshold-only  # verify policy floors
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";
import { isExempt, loadCoveragePolicy, resolveThresholds } from "./coverage-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");
const policyPath = path.join(root, "scripts/coverage-policy.json");
const policy = loadCoveragePolicy(policyPath);

// Workspace-wide `@ailuracode/alpine-*` aliases so tests can import sibling
// packages by name. Provided as an ARRAY sorted longest-first so more specific
// names (e.g. `query-adapter-alpine`) win over prefixes (`query`) during
// Vite's alias resolution.
const packageAliases = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({
    find: `@ailuracode/alpine-${entry.name}`,
    replacement: path.resolve(packagesDir, entry.name, "src/index.ts"),
  }))
  .sort((a, b) => b.find.length - a.find.length);

const args = process.argv.slice(2);
const onlyPackages = args.filter((a) => !a.startsWith("--"));
const thresholdOnly = args.includes("--threshold-only");

function readManifest(name) {
  const manifestPath = path.join(packagesDir, name, "package.json");
  if (!existsSync(manifestPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return {};
  }
}

function hasTests(name) {
  const testDir = path.join(packagesDir, name, "test");
  if (!existsSync(testDir)) {
    return false;
  }
  return readdirSync(testDir, { withFileTypes: true }).some((entry) => {
    if (entry.isDirectory()) {
      return readdirSync(path.join(testDir, entry.name)).some((f) =>
        /\.(test|spec)\.[cm]?[jt]sx?$/.test(f)
      );
    }
    return /\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name);
  });
}

/**
 * Normalize a Vite alias field (object or array) into an array of
 * { find, replacement } entries.
 * @param {unknown} alias
 */
function normalizeAlias(alias) {
  if (!alias) {
    return [];
  }
  if (Array.isArray(alias)) {
    return alias;
  }
  return Object.entries(alias).map(([find, replacement]) => ({ find, replacement }));
}

/**
 * Merge the workspace defaults with a package's own `vitest.config.ts`.
 *
 * The package's `environment`, `setupFiles`, and `globals` are honored (some
 * packages need a jsdom + custom matchMedia/localStorage setup), while the
 * `include` glob is forced to an absolute, package-scoped path so coverage is
 * measured only for that package. The coverage floor is layered on by the
 * caller.
 * @param {Record<string, any>} base
 * @param {Record<string, any>} override
 */
function mergeConfig(base, override) {
  const overrideTest = override.test ?? {};
  return {
    ...base,
    ...override,
    resolve: {
      ...base.resolve,
      ...(override.resolve ?? {}),
      alias: [...normalizeAlias(base.resolve?.alias), ...normalizeAlias(override.resolve?.alias)],
    },
    test: {
      ...base.test,
      ...overrideTest,
      // Force an absolute, package-scoped include so a package never inherits
      // another package's (relative) glob, which would otherwise zero its
      // coverage measurement.
      include: base.test.include,
      name: base.test.name,
    },
  };
}

/**
 * Build a Vitest config for a single package: the workspace defaults plus the
 * package's own `vitest.config.ts`, with the shared coverage floor layered on.
 * @param {string} name
 */
async function buildConfig(name) {
  const manifest = readManifest(name);
  const isPrivate = manifest.private === true;
  const thresholds = resolveThresholds(policy, name);
  const hasTestFiles = hasTests(name);
  const localConfigPath = path.join(packagesDir, name, "vitest.config.ts");

  const defaults = {
    resolve: { alias: packageAliases },
    test: {
      name: `@ailuracode/alpine-${name}`,
      include: [path.join(packagesDir, name, "test/**/*.{test,spec}.ts")],
      exclude: ["**/test/browser/**"],
      environment: "happy-dom",
      setupFiles: [path.join(root, "test/setup.ts")],
    },
  };

  let merged = defaults;
  if (existsSync(localConfigPath)) {
    const local = await import(pathToFileURL(localConfigPath).href);
    merged = mergeConfig(defaults, local.default ?? local);
  }

  merged.test.coverage = {
    provider: "v8",
    reporter: ["text", "html"],
    include: [path.join(packagesDir, name, "src/**/*.ts")],
    exclude: ["**/*.test.ts", "**/*.spec.ts", "**/test/**", "**/global.d.ts", "**/*.d.ts"],
    thresholds:
      isPrivate || !hasTestFiles || isExempt(policy, name)
        ? undefined
        : {
            lines: thresholds.lines,
            statements: thresholds.statements,
            functions: thresholds.functions,
            branches: thresholds.branches,
          },
  };

  return defineConfig(merged);
}

const names = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => (onlyPackages.length === 0 ? true : onlyPackages.includes(name)))
  .sort();

// `threshold-only` validates that the policy floors are documented for every
// public package, without running the full suite. Useful in fast CI checks.
if (thresholdOnly) {
  const missing = names
    .filter((name) => readManifest(name).private !== true && !policy.packages?.[name])
    .map((name) => `@ailuracode/alpine-${name}`);
  if (missing.length > 0) {
    console.error(`coverage-policy.json missing entries for: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`coverage policy: ${Object.keys(policy.packages).length} package floors documented`);
  process.exit(0);
}

const configFile = path.join(root, "vitest.package.generated.ts");

let failed = 0;
for (const name of names) {
  const config = await buildConfig(name);
  writeFileSync(
    configFile,
    `import { defineConfig } from "vitest/config";\nexport default ${JSON.stringify(config, null, 2)};\n`
  );

  const manifest = readManifest(name);
  const hasTestFiles = hasTests(name);
  const label = `@ailuracode/alpine-${name}`;
  if (manifest.private === true || !hasTestFiles) {
    console.log(`⏭  ${label} — skipped (private or no tests)`);
    continue;
  }
  if (isExempt(policy, name)) {
    console.log(`⚠  ${label} — exempt from coverage gate (documented exception)`);
  }

  console.log(`\n▶ ${label}`);
  try {
    execFileSync(
      process.execPath,
      [
        path.join(root, "node_modules/vitest/vitest.mjs"),
        "run",
        "--coverage",
        "--config",
        configFile,
      ],
      { stdio: "inherit", cwd: root }
    );
  } catch (_) {
    failed += 1;
    console.error(`✗ ${label} coverage below floor`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} package(s) failed the per-package coverage gate.`);
  process.exit(1);
}
console.log("\n✓ per-package coverage gate passed");
