import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverPackages } from "./repo-check.mjs";
import { REPO_CHECK_POLICY } from "./repo-check-policy.mjs";

const SCOPE = "@ailuracode/alpine-";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PACKAGE_DOC_ONLY = /^packages\/([^/]+)\/(README|CHANGELOG)\.md$/;
const PACKAGE_FOLDER = /^packages\/([^/]+)(?:\/|$)/;
const PACKAGE_MANIFEST = /^packages\/([^/]+)\/package\.json$/;

const GLOBAL_PATTERNS = [
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^tsconfig\.json$/,
  /^vitest\.config\.ts$/,
  /^biome\.json$/,
  /^scripts\//,
  /^patches\//,
  /^\.github\/actions\//,
  /^\.github\/workflows\//,
  /^test\//,
  /^e2e\//,
];

const E2E_INFRA_PATTERNS = [/^e2e\//, /^scripts\/e2e-run\.mjs$/];

const DEPS_PATTERNS = [
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^patches\//,
  PACKAGE_MANIFEST,
];

const DOCS_ONLY_PATTERNS = [
  /^docs\//,
  /^AGENTS\.md$/,
  /^README\.md$/,
  /^\.cursor\//,
  /^\.changeset\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^\.github\/PULL_REQUEST_TEMPLATE\.md$/,
  /^\.github\/CODEOWNERS$/,
  /^\.github\/dependabot\.yml$/,
  /^\.github\/rulesets\//,
  PACKAGE_DOC_ONLY,
];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

/**
 * @typedef {object} CiChangesOptions
 * @property {string} [root]
 * @property {string} [base]
 * @property {string} [head]
 * @property {string} [eventName]
 * @property {boolean} [forceFull]
 * @property {boolean} [coverage]
 */

/**
 * @typedef {object} CiChangesResult
 * @property {boolean} docsOnly
 * @property {boolean} runFull
 * @property {boolean} runValidate
 * @property {boolean} runAudit
 * @property {boolean} runCoverage
 * @property {boolean} runRepoCheck
 * @property {boolean} runPack
 * @property {boolean} runSize
 * @property {boolean} runDemo
 * @property {boolean} runE2e
 * @property {string[]} changedFolders
 * @property {string[]} buildFolders
 * @property {string[]} testFolders
 * @property {string[]} packFolders
 * @property {string[]} buildFilters
 * @property {string[]} testPaths
 * @property {string[]} e2eFolders
 * @property {string} summary
 */

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => pattern.test(filePath));
}

/**
 * @param {string} rootDir
 * @param {string} base
 * @param {string} head
 * @returns {string[]}
 */
export function listChangedFiles(rootDir, base, head) {
  const stdout = execFileSync("git", ["diff", "--name-only", `${base}...${head}`], {
    cwd: rootDir,
    encoding: "utf8",
  });

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * @param {import("./repo-check.mjs").DiscoveredPackage} manifest
 * @returns {string[]}
 */
function readWorkspaceDependencyNames(manifest) {
  const deps = [];

  for (const field of DEPENDENCY_FIELDS) {
    const section = manifest.manifest[field];
    if (!section || typeof section !== "object") {
      continue;
    }

    for (const [name, version] of Object.entries(section)) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        deps.push(name);
      }
    }
  }

  return deps;
}

/**
 * @param {import("./repo-check.mjs").DiscoveredPackage[]} packages
 */
function buildWorkspaceGraph(packages) {
  /** @type {Map<string, import("./repo-check.mjs").DiscoveredPackage>} */
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  /** @type {Map<string, Set<string>>} */
  const dependencies = new Map();
  /** @type {Map<string, Set<string>>} */
  const dependents = new Map();

  for (const pkg of packages) {
    const deps = readWorkspaceDependencyNames(pkg);
    dependencies.set(pkg.name, new Set(deps));

    for (const dep of deps) {
      const current = dependents.get(dep) ?? new Set();
      current.add(pkg.name);
      dependents.set(dep, current);
    }
  }

  return { byName, dependencies, dependents };
}

/**
 * @param {Iterable<string>} seeds
 * @param {Map<string, Set<string>>} graph
 * @returns {Set<string>}
 */
function collectReachable(seeds, graph) {
  const visited = new Set();
  const queue = [...seeds];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    for (const next of graph.get(current) ?? []) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return visited;
}

/**
 * @param {string} rootDir
 * @returns {Set<string>}
 */
function readDemoDependencyNames(rootDir) {
  const manifestPath = path.join(rootDir, "apps/demo/package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const deps = { ...manifest.dependencies, ...manifest.devDependencies };
  const demoExcluded = new Set(REPO_CHECK_POLICY.demoExcluded);

  return new Set(
    Object.keys(deps).filter(
      (name) => name.startsWith(SCOPE) && !demoExcluded.has(name.slice(SCOPE.length))
    )
  );
}

/**
 * @param {string} filePath
 * @returns {string | null}
 */
function packageFolderFromPath(filePath) {
  const match = filePath.match(PACKAGE_FOLDER);
  return match ? match[1] : null;
}

/**
 * @param {string[]} files
 * @returns {string[]}
 */
export function changedPackageFolders(files) {
  const folders = new Set();

  for (const file of files) {
    if (PACKAGE_DOC_ONLY.test(file)) {
      continue;
    }

    const folder = packageFolderFromPath(file);
    if (folder) {
      folders.add(folder);
    }
  }

  return [...folders].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
export function isDocumentationOnlyChange(files) {
  if (files.length === 0) {
    return true;
  }

  return files.every((file) => matchesAny(file, DOCS_ONLY_PATTERNS));
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
export function hasGlobalChanges(files) {
  return files.some((file) => matchesAny(file, GLOBAL_PATTERNS));
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
export function hasDependencyChanges(files) {
  return files.some((file) => matchesAny(file, DEPS_PATTERNS));
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
export function hasDemoChanges(files) {
  return files.some((file) => file.startsWith("apps/demo/"));
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
export function hasManifestChanges(files) {
  return files.some((file) => PACKAGE_MANIFEST.test(file) || file === "package.json");
}

/**
 * @param {Set<string>} names
 * @param {Map<string, import("./repo-check.mjs").DiscoveredPackage>} byName
 * @returns {string[]}
 */
function namesToFolders(names, byName) {
  const folders = new Set();

  for (const name of names) {
    const pkg = byName.get(name);
    if (pkg) {
      folders.add(pkg.folder);
    }
  }

  return [...folders].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string[]} folders
 * @param {Map<string, import("./repo-check.mjs").DiscoveredPackage>} byName
 * @returns {string[]}
 */
function foldersToNames(folders, byName) {
  const names = [];

  for (const pkg of byName.values()) {
    if (folders.includes(pkg.folder)) {
      names.push(pkg.name);
    }
  }

  return names.sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string[]} names
 * @returns {string[]}
 */
export function buildPnpmFilters(names) {
  return names.map((name) => `${name}...`);
}

/**
 * @param {string[]} folders
 * @returns {string[]}
 */
/**
 * @param {string} packagesDir
 * @returns {Set<string>}
 */
function discoverE2ePackageFolders(packagesDir) {
  if (!existsSync(packagesDir)) {
    return new Set();
  }

  return new Set(
    readdirSync(packagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((folder) => existsSync(path.join(packagesDir, folder, "playwright.config.ts")))
  );
}

/**
 * @param {string[]} folders
 * @param {Set<string>} available
 * @returns {string[]}
 */
export function e2eFoldersForPackages(folders, available) {
  return folders.filter((folder) => available.has(folder)).sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string[]} files
 * @returns {boolean}
 */
export function hasE2eInfraChanges(files) {
  return files.some((file) => matchesAny(file, E2E_INFRA_PATTERNS));
}

export function vitestPathsForFolders(folders) {
  const paths = folders.map((folder) => `packages/${folder}/test`);

  if (existsSync(path.join(root, "apps/demo/test"))) {
    // Demo tests are appended by callers when demo validation is required.
  }

  return paths;
}

/**
 * @param {string} summary
 * @param {Partial<CiChangesResult>} [overrides]
 * @returns {CiChangesResult}
 */
function createFullCiResult(summary, overrides = {}) {
  const allPackages = discoverPackages(path.join(root, "packages"));
  const allFolders = allPackages.map((pkg) => pkg.folder);
  const testPaths = vitestPathsForFolders(allFolders);

  return {
    docsOnly: false,
    runFull: true,
    runValidate: true,
    runAudit: true,
    runCoverage: true,
    runRepoCheck: true,
    runPack: true,
    runSize: true,
    runDemo: true,
    runE2e: true,
    changedFolders: [],
    buildFolders: allFolders,
    testFolders: allFolders,
    packFolders: [],
    buildFilters: [],
    testPaths,
    e2eFolders: [],
    summary,
    ...overrides,
  };
}

/**
 * @returns {CiChangesResult}
 */
function createDocsOnlyResult() {
  return {
    docsOnly: true,
    runFull: false,
    runValidate: false,
    runAudit: false,
    runCoverage: false,
    runRepoCheck: false,
    runPack: false,
    runSize: false,
    runDemo: false,
    runE2e: false,
    changedFolders: [],
    buildFolders: [],
    testFolders: [],
    packFolders: [],
    buildFilters: [],
    testPaths: [],
    e2eFolders: [],
    summary: "Documentation-only changes",
  };
}

/**
 * @param {string[]} files
 * @param {string} rootDir
 * @param {boolean} coverage
 * @returns {CiChangesResult}
 */
function analyzeAffectedPackageChanges(files, rootDir, coverage) {
  const dependencyChanges = hasDependencyChanges(files);
  const demoChanged = hasDemoChanges(files);
  const manifestChanges = hasManifestChanges(files);
  const packages = discoverPackages(path.join(rootDir, "packages"));
  const graph = buildWorkspaceGraph(packages);
  const changedFolders = changedPackageFolders(files);
  const changedNames = foldersToNames(changedFolders, graph.byName);
  const buildNames = collectReachable(new Set(changedNames), graph.dependencies);
  const testNames = collectReachable(new Set(changedNames), graph.dependents);

  for (const name of changedNames) {
    buildNames.add(name);
    testNames.add(name);
  }

  const buildFolders = namesToFolders(buildNames, graph.byName);
  const testFolders = namesToFolders(testNames, graph.byName);
  const publishableChanged = packages
    .filter((pkg) => changedFolders.includes(pkg.folder) && !pkg.isPrivate)
    .map((pkg) => pkg.folder);
  const demoDeps = readDemoDependencyNames(rootDir);
  const affectsDemo = changedNames.some((name) => demoDeps.has(name));
  const buildFilterNames =
    changedNames.length > 0 ? changedNames : demoChanged ? [...demoDeps] : [];
  const testPaths = vitestPathsForFolders(testFolders);
  const e2eAvailable = discoverE2ePackageFolders(path.join(rootDir, "packages"));
  const e2eFolders = e2eFoldersForPackages(testFolders, e2eAvailable);
  const e2eInfraChanged = hasE2eInfraChanges(files);

  if (demoChanged || affectsDemo) {
    testPaths.push("apps/demo/test");
  }

  return {
    docsOnly: false,
    runFull: false,
    runValidate: changedFolders.length > 0 || demoChanged,
    runAudit: dependencyChanges,
    runCoverage: coverage,
    runRepoCheck: manifestChanges,
    runPack: publishableChanged.length > 0,
    runSize: publishableChanged.length > 0,
    runDemo: demoChanged || affectsDemo,
    runE2e: e2eInfraChanged || e2eFolders.length > 0,
    changedFolders,
    buildFolders,
    testFolders,
    packFolders: publishableChanged,
    buildFilters: buildPnpmFilters(buildFilterNames),
    testPaths,
    e2eFolders,
    summary:
      changedFolders.length > 0
        ? `Affected packages: ${changedFolders.join(", ")}`
        : "No package source changes detected",
  };
}

/**
 * @param {string[]} files
 * @param {CiChangesOptions} [options]
 * @returns {CiChangesResult}
 */
export function analyzeChangedFiles(files, options = {}) {
  const rootDir = options.root ?? root;
  const eventName = options.eventName ?? "pull_request";
  const forceFull = options.forceFull === true;
  const coverage = options.coverage === true;

  if (forceFull || eventName === "schedule") {
    return createFullCiResult("Full CI requested");
  }

  if (isDocumentationOnlyChange(files)) {
    return createDocsOnlyResult();
  }

  if (hasGlobalChanges(files)) {
    return createFullCiResult("Global tooling or shared harness changed", {
      runAudit: hasDependencyChanges(files),
      runCoverage: coverage,
      changedFolders: changedPackageFolders(files),
      runDemo: hasDemoChanges(files) || changedPackageFolders(files).length > 0,
    });
  }

  return analyzeAffectedPackageChanges(files, rootDir, coverage);
}

/**
 * @param {CiChangesOptions} [options]
 * @returns {CiChangesResult}
 */
export function analyzeCiChanges(options = {}) {
  const rootDir = options.root ?? root;
  const eventName = options.eventName ?? process.env.GITHUB_EVENT_NAME ?? "pull_request";
  const forceFull = options.forceFull === true || process.env.FORCE_FULL_CI === "true";
  const coverage =
    options.coverage === true ||
    eventName === "schedule" ||
    (eventName === "push" && process.env.GITHUB_REF === "refs/heads/master");

  if (forceFull || eventName === "schedule") {
    return analyzeChangedFiles([], { ...options, forceFull: true, eventName });
  }

  if (eventName === "push" && process.env.GITHUB_REF === "refs/heads/master") {
    return analyzeChangedFiles([], { ...options, forceFull: true, eventName, coverage: true });
  }

  const base = options.base ?? process.env.CI_BASE_REF ?? "origin/master";
  const head = options.head ?? process.env.CI_HEAD_REF ?? "HEAD";
  const files = listChangedFiles(rootDir, base, head);
  return analyzeChangedFiles(files, { ...options, eventName, coverage });
}

/**
 * @param {CiChangesResult} result
 * @returns {Record<string, string>}
 */
export function toGithubOutputs(result) {
  return {
    docs_only: String(result.docsOnly),
    run_full: String(result.runFull),
    run_validate: String(result.runValidate),
    run_audit: String(result.runAudit),
    run_coverage: String(result.runCoverage),
    run_repo_check: String(result.runRepoCheck),
    run_pack: String(result.runPack),
    run_size: String(result.runSize),
    run_demo: String(result.runDemo),
    run_e2e: String(result.runE2e),
    changed_packages: result.changedFolders.join(","),
    build_packages: result.buildFolders.join(","),
    test_packages: result.testFolders.join(","),
    pack_packages: result.packFolders.join(","),
    build_filters: result.buildFilters.join(","),
    test_paths: result.testPaths.join(" "),
    e2e_packages: result.e2eFolders.join(","),
    summary: result.summary,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const asJson = args.has("--json");
  const asGithub = args.has("--github");

  const baseIndex = process.argv.indexOf("--base");
  const headIndex = process.argv.indexOf("--head");
  const result = analyzeCiChanges({
    forceFull: args.has("--full"),
    coverage: args.has("--coverage"),
    base: baseIndex >= 0 ? process.argv[baseIndex + 1] : undefined,
    head: headIndex >= 0 ? process.argv[headIndex + 1] : undefined,
  });

  if (asGithub) {
    const outputFile = process.env.GITHUB_OUTPUT;
    if (!outputFile) {
      throw new Error("GITHUB_OUTPUT is not set");
    }

    for (const [key, value] of Object.entries(toGithubOutputs(result))) {
      appendFileSync(outputFile, `${key}=${value.replace(/\n/g, "%0A")}\n`);
    }
    return;
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(result.summary);
  console.log(JSON.stringify(result, null, 2));
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
