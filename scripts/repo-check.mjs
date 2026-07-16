import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUNDLE_CATEGORY_DEFAULT_COLD_GZIP_BYTES,
  BUNDLE_CATEGORY_INTRINSIC_GZIP_BYTES,
} from "./bundle-report-policy.mjs";
import { validateHeadlessCssPolicy } from "./headless-css-policy.mjs";
import { validatePackageCatalogSurfaces } from "./package-catalog-check.mjs";
import { validateReadmes } from "./readme-check.mjs";
import { REPO_CHECK_POLICY } from "./repo-check-policy.mjs";

const SCOPE = "@ailuracode/alpine-";
const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/;
const REQUIRED_MANIFEST_FIELDS = ["license", "homepage", "exports", "files"];
const REQUIRED_REPO_FIELDS = ["type", "url", "directory"];
const REQUIRED_PACKAGE_FILES = ["README.md", "CHANGELOG.md"];
const REQUIRED_PUBLISH_FILES = ["dist", "README.md"];
const BUNDLE_BUDGET_CATEGORIES = new Set([
  "primitive",
  "infrastructure",
  "small-feature",
  "complex-feature",
  "adapter",
]);

/**
 * @typedef {object} DiscoveredPackage
 * @property {string} folder
 * @property {string} name
 * @property {string} dir
 * @property {Record<string, unknown>} manifest
 * @property {boolean} isPrivate
 */

/**
 * @typedef {object} RepoCheckOptions
 * @property {string} [root]
 * @property {string} [packagesDir]
 * @property {boolean} [requireBuilt]
 * @property {string[]} [packageFolders]
 */

/**
 * @typedef {object} RepoCheckResult
 * @property {boolean} ok
 * @property {string[]} errors
 * @property {DiscoveredPackage[]} packages
 * @property {number} catalogCount
 */

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {DiscoveredPackage[]} packages
 * @param {string[]} excluded
 */
function filterPublicPackages(packages, excluded) {
  const excludedSet = new Set(excluded);
  return packages.filter((pkg) => !(pkg.isPrivate || excludedSet.has(pkg.folder)));
}

/**
 * @param {string} packagesDir
 * @returns {DiscoveredPackage[]}
 */
export function discoverPackages(packagesDir) {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(packagesDir, entry.name);
      const manifestPath = path.join(dir, "package.json");

      if (!existsSync(manifestPath)) {
        return null;
      }

      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      const expectedName = `${SCOPE}${entry.name}`;

      return {
        folder: entry.name,
        name: typeof manifest.name === "string" ? manifest.name : expectedName,
        dir,
        manifest,
        isPrivate: manifest.private === true,
      };
    })
    .filter((pkg) => pkg !== null)
    .sort((a, b) => a.folder.localeCompare(b.folder));
}

/**
 * @param {DiscoveredPackage[]} packages
 * @returns {DiscoveredPackage[]}
 */
export function catalogPackages(packages) {
  return filterPublicPackages(packages, REPO_CHECK_POLICY.catalogExcluded);
}

/**
 * @param {DiscoveredPackage[]} packages
 * @returns {DiscoveredPackage[]}
 */
export function demoPackages(packages) {
  return filterPublicPackages(packages, REPO_CHECK_POLICY.demoExcluded);
}

/**
 * @param {DiscoveredPackage[]} packages
 * @returns {DiscoveredPackage[]}
 */
export function publishablePackages(packages) {
  return packages.filter((pkg) => !pkg.isPrivate);
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {Record<string, unknown> | null}
 */
function readToolkitMetadata(pkg) {
  const toolkit = pkg.manifest.toolkit;
  return toolkit && typeof toolkit === "object" ? toolkit : null;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {Record<string, unknown> | null}
 */
export function readBundleBudgetMetadata(pkg) {
  const toolkit = readToolkitMetadata(pkg);
  const bundleBudget = toolkit?.bundleBudget;
  return bundleBudget && typeof bundleBudget === "object" ? bundleBudget : null;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {unknown[] | null}
 */
export function expectedSizeLimitConfig(pkg) {
  const sizeLimit = pkg.manifest["size-limit"];
  return Array.isArray(sizeLimit) ? JSON.parse(JSON.stringify(sizeLimit)) : null;
}

/**
 * @param {string} root
 * @returns {Set<string>}
 */
function readTsconfigPaths(root) {
  const tsconfig = JSON.parse(readFileSync(path.join(root, "tsconfig.json"), "utf8"));
  return new Set(Object.keys(tsconfig.compilerOptions?.paths ?? {}));
}

/**
 * @param {string} demoRoot
 * @returns {Set<string>}
 */
function readDemoTsconfigPaths(demoRoot) {
  const tsconfig = JSON.parse(readFileSync(path.join(demoRoot, "tsconfig.json"), "utf8"));
  return new Set(
    Object.keys(tsconfig.compilerOptions?.paths ?? {}).filter((key) => key.startsWith(SCOPE))
  );
}

/**
 * @param {string} demoRoot
 * @returns {Set<string>}
 */
function readDemoPackageDeps(demoRoot) {
  const manifest = JSON.parse(readFileSync(path.join(demoRoot, "package.json"), "utf8"));
  const deps = { ...manifest.dependencies, ...manifest.devDependencies };
  return new Set(Object.keys(deps).filter((key) => key.startsWith(SCOPE)));
}

/**
 * @param {string} astroConfigPath
 * @returns {Set<string>}
 */
function readAstroAliases(astroConfigPath) {
  const source = readFileSync(astroConfigPath, "utf8");
  return new Set(source.match(/@ailuracode\/alpine-[a-z0-9-]+/g) ?? []);
}

/**
 * @param {string} filePath
 * @returns {Set<string>}
 */
export function readMarkdownPackageNames(filePath) {
  const source = readFileSync(filePath, "utf8");
  return new Set(source.match(/@ailuracode\/alpine-[a-z0-9-]+/g) ?? []);
}

/**
 * @param {string} filePath
 * @returns {number | null}
 */
function readDocumentedPackageCount(filePath) {
  const match = readFileSync(filePath, "utf8").match(/(\d+)\s+independent npm packages/i);
  return match ? Number(match[1]) : null;
}

/**
 * @param {DiscoveredPackage[]} packages
 * @returns {string[]}
 */
function validateSizeBudgetPolicyEntry(pkg) {
  const errors = [];
  const rule = readBundleBudgetMetadata(pkg);

  if (!rule) {
    return [`${pkg.name}: package.json missing toolkit.bundleBudget metadata`];
  }

  if (typeof rule.category !== "string" || !BUNDLE_BUDGET_CATEGORIES.has(rule.category)) {
    errors.push(`${pkg.name}: bundle budget category must be recognized`);
  } else if (
    BUNDLE_CATEGORY_INTRINSIC_GZIP_BYTES[rule.category] == null ||
    BUNDLE_CATEGORY_DEFAULT_COLD_GZIP_BYTES[rule.category] == null
  ) {
    errors.push(`${pkg.name}: bundle budget category "${rule.category}" is missing numeric limits`);
  }

  const configPath = path.join(pkg.dir, ".size-limit.json");
  const relativeConfigPath = `packages/${pkg.folder}/.size-limit.json`;

  if (typeof rule.exclude === "string") {
    if (existsSync(configPath)) {
      errors.push(`${pkg.name}: ${relativeConfigPath} must not exist for excluded packages`);
    }

    if (Array.isArray(pkg.manifest["size-limit"])) {
      errors.push(`${pkg.name}: package.json size-limit must not exist for excluded packages`);
    }

    return errors;
  }

  const expected = expectedSizeLimitConfig(pkg);
  if (!Array.isArray(expected) || expected.length === 0) {
    errors.push(`${pkg.name}: package.json must define a non-empty "size-limit" array`);
    return errors;
  }

  if (existsSync(configPath)) {
    errors.push(`${pkg.name}: ${relativeConfigPath} is deprecated; use package.json "size-limit"`);
  }

  const scripts = pkg.manifest.scripts;
  if (!scripts || typeof scripts !== "object" || typeof scripts.size !== "string") {
    errors.push(`${pkg.name}: package.json must include a "size" script`);
  }

  return errors;
}

/**
 * @param {DiscoveredPackage[]} packages
 * @param {string} root
 * @returns {string[]}
 */
function validateSizeBudgets(packages, root) {
  const errors = [];

  if (existsSync(path.join(root, ".size-limit.json"))) {
    errors.push('Root .size-limit.json is deprecated; use package.json "size-limit"');
  }

  for (const pkg of packages) {
    if (pkg.isPrivate) {
      continue;
    }

    errors.push(...validateSizeBudgetPolicyEntry(pkg));
  }

  return errors;
}

/**
 * @param {string} packCheckPath
 * @returns {boolean}
 */
function packCheckUsesDynamicDiscovery(packCheckPath) {
  const source = readFileSync(packCheckPath, "utf8");
  return source.includes("discoverPackages") || source.includes("discoverPublishablePackages");
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function packageHasTests(dir) {
  const testDir = path.join(dir, "test");
  if (!existsSync(testDir)) {
    return false;
  }

  const stack = [testDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (TEST_FILE_PATTERN.test(entry.name)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function collectExportTargets(value) {
  if (typeof value === "string") {
    return [value];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = /** @type {Record<string, unknown>} */ (value);
  const targets = [];

  for (const key of ["types", "import", "require", "default"]) {
    if (typeof record[key] === "string") {
      targets.push(record[key]);
    }
  }

  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") {
      targets.push(...collectExportTargets(nested));
    }
  }

  return targets;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {string[]}
 */
function validateRequiredPackageFiles(pkg) {
  const errors = [];

  for (const fileName of REQUIRED_PACKAGE_FILES) {
    if (!existsSync(path.join(pkg.dir, fileName))) {
      errors.push(`${pkg.name}: missing ${fileName}`);
    }
  }

  return errors;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {string[]}
 */
function validateManifestFields(pkg) {
  const errors = [];
  const { manifest, name } = pkg;

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) {
      errors.push(`${name}: package.json missing "${field}"`);
    }
  }

  return errors;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {string[]}
 */
function validateRepositoryMetadata(pkg) {
  const errors = [];
  const repository = pkg.manifest.repository;

  if (!repository || typeof repository !== "object") {
    errors.push(`${pkg.name}: package.json missing "repository" object`);
    return errors;
  }

  const repo = /** @type {Record<string, unknown>} */ (repository);
  for (const field of REQUIRED_REPO_FIELDS) {
    if (typeof repo[field] !== "string" || repo[field].length === 0) {
      errors.push(`${pkg.name}: repository.${field} is required`);
    }
  }

  return errors;
}

/**
 * @param {unknown} sideEffects
 * @returns {boolean}
 */
export function isValidSideEffectsMetadata(sideEffects) {
  if (sideEffects === false) {
    return true;
  }

  if (!Array.isArray(sideEffects) || sideEffects.length === 0) {
    return false;
  }

  return sideEffects.every((entry) => typeof entry === "string" && entry.length > 0);
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {string[]}
 */
export function validateSideEffectsMetadata(pkg) {
  const errors = [];

  if (pkg.isPrivate) {
    return errors;
  }

  if (!("sideEffects" in pkg.manifest)) {
    errors.push(`${pkg.name}: package.json missing "sideEffects"`);
    return errors;
  }

  const sideEffects = pkg.manifest.sideEffects;

  if (sideEffects === true) {
    errors.push(`${pkg.name}: sideEffects must be false or a non-empty file allowlist, not true`);
    return errors;
  }

  if (!isValidSideEffectsMetadata(sideEffects)) {
    errors.push(`${pkg.name}: sideEffects must be false or a non-empty array of file glob strings`);
  }

  return errors;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {string[]}
 */
function validatePublishMetadata(pkg) {
  const errors = [];
  const files = pkg.manifest.files;

  if (!pkg.isPrivate && pkg.manifest.publishConfig?.access !== "public") {
    errors.push(`${pkg.name}: publishConfig.access must be "public"`);
  }

  if (!Array.isArray(files)) {
    return errors;
  }

  for (const entry of REQUIRED_PUBLISH_FILES) {
    if (!files.includes(entry)) {
      errors.push(`${pkg.name}: files must include "${entry}"`);
    }
  }

  return errors;
}

/**
 * @param {DiscoveredPackage} pkg
 * @returns {string[]}
 */
function validateBuiltExports(pkg) {
  const errors = [];
  const exportTargets = collectExportTargets(pkg.manifest.exports);
  const typesField = typeof pkg.manifest.types === "string" ? pkg.manifest.types : null;

  if (typesField) {
    exportTargets.push(typesField);
  }

  for (const target of new Set(exportTargets)) {
    if (!target.startsWith("./")) {
      continue;
    }

    if (!existsSync(path.join(pkg.dir, target))) {
      errors.push(`${pkg.name}: missing built artifact ${target}`);
    }
  }

  return errors;
}

/**
 * @param {DiscoveredPackage} pkg
 * @param {boolean} requireBuilt
 * @returns {string[]}
 */
function validatePackageMetadata(pkg, requireBuilt) {
  const expectedName = `${SCOPE}${pkg.folder}`;
  const errors = [];

  if (pkg.name !== expectedName) {
    errors.push(`${pkg.name}: package name must be ${expectedName}`);
  }

  errors.push(
    ...validateRequiredPackageFiles(pkg),
    ...validateManifestFields(pkg),
    ...validateRepositoryMetadata(pkg),
    ...validatePublishMetadata(pkg),
    ...validateSideEffectsMetadata(pkg)
  );

  if (requireBuilt) {
    errors.push(...validateBuiltExports(pkg));
  }

  return errors;
}

/**
 * @param {string} name
 * @returns {string}
 */
export function packageSurfaceBaseName(name) {
  const match = name.match(/^(@ailuracode\/alpine-[a-z0-9-]+)/);
  return match?.[1] ?? name;
}

/**
 * @param {string} name
 * @param {Set<string>} expectedNames
 * @returns {boolean}
 */
export function isAllowedPackageSurfaceName(name, expectedNames) {
  if (!name.startsWith(SCOPE)) {
    return true;
  }

  return expectedNames.has(packageSurfaceBaseName(name));
}

/**
 * @param {Set<string>} actual
 * @param {Iterable<DiscoveredPackage>} expected
 * @param {string} surface
 * @returns {string[]}
 */
export function diffSurface(actual, expected, surface) {
  const errors = [];
  const expectedNames = new Set([...expected].map((pkg) => pkg.name));

  for (const pkg of expected) {
    if (!actual.has(pkg.name)) {
      errors.push(`${surface}: missing ${pkg.name}`);
    }
  }

  for (const name of actual) {
    if (isAllowedPackageSurfaceName(name, expectedNames)) {
      continue;
    }

    errors.push(`${surface}: unexpected ${name}`);
  }

  return errors;
}

/**
 * @param {string} root
 * @param {DiscoveredPackage[]} packages
 * @param {DiscoveredPackage[]} catalog
 * @param {DiscoveredPackage[]} demo
 * @returns {string[]}
 */
function validateRepositorySurfaces(root, packages, catalog, demo) {
  const demoRoot = path.join(root, "apps/demo");

  return [
    ...diffSurface(readTsconfigPaths(root), packages, "tsconfig.json paths"),
    ...diffSurface(readDemoTsconfigPaths(demoRoot), demo, "apps/demo/tsconfig.json paths"),
    ...diffSurface(readDemoPackageDeps(demoRoot), demo, "apps/demo/package.json dependencies"),
    ...diffSurface(
      readAstroAliases(path.join(demoRoot, "astro.config.ts")),
      demo,
      "apps/demo/astro.config.ts aliases"
    ),
    ...diffSurface(
      readMarkdownPackageNames(path.join(root, "README.md")),
      catalog,
      "README.md package catalog"
    ),
    ...diffSurface(
      readMarkdownPackageNames(path.join(root, "AGENTS.md")),
      catalog,
      "AGENTS.md package catalog"
    ),
  ];
}

/**
 * @param {string} root
 * @param {number} catalogCount
 * @returns {string[]}
 */
function validateDocumentedCounts(root, catalogCount) {
  const errors = [];

  for (const [file, label] of [
    [path.join(root, "README.md"), "README.md"],
    [path.join(root, "AGENTS.md"), "AGENTS.md"],
  ]) {
    const documented = readDocumentedPackageCount(file);
    if (documented === null) {
      errors.push(`${label}: could not find documented package count`);
      continue;
    }

    if (documented !== catalogCount) {
      errors.push(`${label}: documents ${documented} packages but catalog has ${catalogCount}`);
    }
  }

  return errors;
}

/**
 * @param {DiscoveredPackage[]} packages
 * @returns {string[]}
 */
function validatePackageTests(packages) {
  const errors = [];
  const testExcluded = new Set(REPO_CHECK_POLICY.testExcluded);

  for (const pkg of packages) {
    if (testExcluded.has(pkg.folder) || packageHasTests(pkg.dir)) {
      continue;
    }

    errors.push(`${pkg.name}: missing tests in packages/${pkg.folder}/test/`);
  }

  return errors;
}

/**
 * @param {string} root
 * @param {DiscoveredPackage[]} publishable
 * @returns {string[]}
 */
function validateTooling(root, publishable) {
  const errors = [];

  if (!packCheckUsesDynamicDiscovery(path.join(root, "scripts/pack-check.mjs"))) {
    errors.push("scripts/pack-check.mjs: must discover publishable packages dynamically");
  }

  if (publishable.length === 0) {
    errors.push("packages/: no publishable packages discovered");
  }

  return errors;
}

/**
 * Validate dependency direction boundaries for infrastructure packages.
 * Packages listed in REPO_CHECK_POLICY.depBoundaries must not import
 * higher-level `@ailuracode/alpine-*` packages via source imports.
 *
 * @param {string} root
 * @returns {string[]}
 */
function validateDepBoundaries(root) {
  const boundaries = REPO_CHECK_POLICY.depBoundaries;
  if (!boundaries) {
    return [];
  }

  const errors = [];
  const packagesDir = path.join(root, "packages");

  for (const [folder, allowed] of Object.entries(boundaries)) {
    const srcDir = path.join(packagesDir, folder, "src");
    if (!existsSync(srcDir)) {
      continue;
    }

    /** @type {string[]} */
    const imports = [];
    readDirRecursive(srcDir, (filePath) => {
      if (!(filePath.endsWith(".ts") || filePath.endsWith(".mjs"))) {
        return;
      }
      const source = readFileSync(filePath, "utf8");
      for (const match of source.matchAll(/from\s+["'](@ailuracode\/alpine-[^"']+)["']/g)) {
        imports.push(match[1]);
      }
    });

    const disallowed = imports.filter(
      (imp) => !(allowed.includes(imp) || imp.startsWith(`${SCOPE}ui/`))
    );

    if (disallowed.length > 0) {
      errors.push(
        `packages/${folder}: imports disallowed toolkit packages: [${[...new Set(disallowed)].join(", ")}]`
      );
    }
  }

  return errors;
}

/**
 * @param {string} dir
 * @param {(filePath: string) => void} visit
 */
function readDirRecursive(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readDirRecursive(fullPath, visit);
    } else {
      visit(fullPath);
    }
  }
}

/**
 * @param {RepoCheckOptions} [options]
 * @returns {RepoCheckResult}
 */
export function runRepoCheck(options = {}) {
  const root = options.root ?? defaultRoot;
  const packagesDir = options.packagesDir ?? path.join(root, "packages");
  const requireBuilt = options.requireBuilt ?? false;
  const packageFolders = options.packageFolders;
  const hasPackageFilter = Array.isArray(packageFolders) && packageFolders.length > 0;
  const packages = discoverPackages(packagesDir);
  const catalog = catalogPackages(packages);
  const demo = demoPackages(packages);
  const publishable = publishablePackages(packages);
  const errors = [];

  for (const pkg of packages) {
    if (hasPackageFilter && !packageFolders.includes(pkg.folder)) {
      continue;
    }

    errors.push(...validatePackageMetadata(pkg, requireBuilt));
  }

  if (!hasPackageFilter) {
    validateHeadlessCssPolicy.readFile = (filePath) => readFileSync(filePath, "utf8");
    errors.push(
      ...validateRepositorySurfaces(root, packages, catalog, demo),
      ...validateDocumentedCounts(root, catalog.length),
      ...validatePackageCatalogSurfaces(root),
      ...validateReadmes(root),
      ...validateSizeBudgets(packages, root),
      ...validatePackageTests(packages),
      ...validateTooling(root, publishable),
      ...validateDepBoundaries(root),
      ...validateHeadlessCssPolicy(root, readDirRecursive)
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    packages,
    catalogCount: catalog.length,
  };
}

function main() {
  const args = process.argv.slice(2);
  const argSet = new Set(args);
  const packagesIndex = args.indexOf("--packages");
  const packageFolders =
    packagesIndex >= 0
      ? args[packagesIndex + 1]
          ?.split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : undefined;

  const result = runRepoCheck({
    requireBuilt: argSet.has("--built"),
    packageFolders,
  });

  if (result.ok) {
    console.log(
      `repo:check passed (${result.packages.length} packages, ${result.catalogCount} catalog entries)`
    );
    process.exit(0);
  }

  console.error("repo:check failed:\n");
  for (const error of result.errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const modulePath = fileURLToPath(import.meta.url);

if (entryPath === modulePath) {
  main();
}
