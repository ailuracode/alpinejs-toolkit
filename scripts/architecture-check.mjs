import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHITECTURE_CHECK_POLICY } from "./architecture-check-policy.mjs";
import { validateHeadlessCssPolicy } from "./headless-css-policy.mjs";
import { discoverPackages, publishablePackages } from "./repo-check.mjs";

const SCOPE = "@ailuracode/alpine-";
const SOURCE_FILE_PATTERN = /\.(?:[cm]?ts|[cm]?js)$/;
const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const FROM_INTERNAL_RE = /\bfrom\s+["'](?:\.\/|\.\.\/)internal\//;
const FROM_ADAPTER_RE = /\bfrom\s+["'](?:\.\/|\.\.\/)(?:alpine|bindings?|adapter)\//;
const VALUE_ALPINE_IMPORT_RE = /^import\s+(?!type\b)[\s\S]*?\sfrom\s+["']alpinejs["']/m;
const INDEX_IMPORT_RE = /from\s+["'](?:\.\.\/)+src\/index(?:\.(?:js|ts))?["']/;
const CONTROLLER_FILE_RE = /(?:^|\/)controller(?:[-.][^/]+)?\.(?:[cm]?ts|[cm]?js)$/;
const CONTROLLER_EXPORT_RE = /\b[A-Z][A-Za-z0-9]*Controller\b/;

const CONSTRUCTOR_SIDE_EFFECT_PATTERNS = [
  { id: "window-access", pattern: /(?<!typeof )window\./ },
  { id: "document-access", pattern: /(?<!typeof )document\./ },
  { id: "local-storage", pattern: /\blocalStorage\b/ },
  { id: "session-storage", pattern: /\bsessionStorage\b/ },
  { id: "navigator-access", pattern: /(?<!typeof )navigator\./ },
  { id: "set-timeout", pattern: /\bsetTimeout\s*\(/ },
  { id: "set-interval", pattern: /\bsetInterval\s*\(/ },
  { id: "queue-microtask", pattern: /\bqueueMicrotask\s*\(/ },
  { id: "request-animation-frame", pattern: /\brequestAnimationFrame\s*\(/ },
];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

/**
 * @typedef {typeof ARCHITECTURE_CHECK_POLICY} ArchitectureCheckPolicy
 */

/**
 * @typedef {object} ArchitectureCheckOptions
 * @property {string} [root]
 * @property {string} [packagesDir]
 * @property {ArchitectureCheckPolicy} [policy]
 */

/**
 * @typedef {object} ArchitectureCheckResult
 * @property {boolean} ok
 * @property {string[]} errors
 * @property {number} packageCount
 */

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {string} dir
 * @param {(filePath: string) => void} visit
 */
export function readDirRecursive(dir, visit) {
  if (!existsSync(dir)) {
    return;
  }

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
 * @param {string} filePath
 * @param {readonly RegExp[]} patterns
 * @returns {boolean}
 */
export function matchesAnyPattern(filePath, patterns) {
  const baseName = path.basename(filePath);
  return patterns.some((pattern) => pattern.test(baseName) || pattern.test(filePath));
}

/**
 * @param {string} source
 * @returns {string[]}
 */
export function extractConstructorBodies(source) {
  const bodies = [];
  const re = /constructor\s*\([^)]*\)\s*\{/g;
  let match = re.exec(source);

  while (match !== null) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;

    while (index < source.length && depth > 0) {
      const char = source[index];
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      }
      index += 1;
    }

    bodies.push(source.slice(start, index - 1));
    match = re.exec(source);
  }

  return bodies;
}

/**
 * @param {string} body
 * @returns {string[]}
 */
export function findConstructorSideEffectViolations(body) {
  const violations = [];
  for (const rule of CONSTRUCTOR_SIDE_EFFECT_PATTERNS) {
    if (rule.pattern.test(body)) {
      violations.push(rule.id);
    }
  }
  return violations;
}

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isControllerSourceFile(relativePath) {
  return (
    relativePath.startsWith("packages/") &&
    relativePath.includes("/src/") &&
    !relativePath.includes("/test/") &&
    CONTROLLER_FILE_RE.test(relativePath)
  );
}

/**
 * @param {string} root
 * @param {ArchitectureCheckPolicy} policy
 * @returns {string[]}
 */
export function validateInternalBarrelExports(root, policy) {
  const errors = [];
  const packagesDir = path.join(root, "packages");
  const exceptions = new Set(policy.internalBarrelExceptions);

  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (exceptions.has(entry.name)) {
      continue;
    }

    const barrelPath = path.join(packagesDir, entry.name, "src", "index.ts");
    if (!existsSync(barrelPath)) {
      continue;
    }

    const barrel = readFileSync(barrelPath, "utf8");
    const violations = barrel
      .split(/\r?\n/)
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => FROM_INTERNAL_RE.test(line) || FROM_ADAPTER_RE.test(line));

    for (const violation of violations) {
      const adapterMatch = violation.line.match(FROM_ADAPTER_RE);
      const kind = adapterMatch ? "alpine adapter" : "internal";
      errors.push(
        `packages/${entry.name}/src/index.ts:${violation.lineNumber}: public barrel must not re-export from ${kind} path (${violation.line.trim()})`
      );
    }
  }

  return errors;
}

/**
 * @param {string} source
 * @returns {string[]}
 */
export function findCrossPackageInternalImportViolations(source) {
  const errors = [];
  const pattern = /from\s+["']@ailuracode\/alpine-[^"']+\/(?:src\/)?internal\//g;

  for (const match of source.matchAll(pattern)) {
    errors.push(
      `cross-package import must not target another package's internal path (${match[0]})`
    );
  }

  return errors;
}

/**
 * @param {string} relativePath
 * @param {string} source
 * @param {ArchitectureCheckPolicy} policy
 * @returns {string[]}
 */
export function findUnitTestImportViolations(relativePath, source, policy) {
  if (!TEST_FILE_PATTERN.test(relativePath)) {
    return [];
  }

  if (
    matchesAnyPattern(relativePath, policy.entrypointTestPatterns) ||
    !matchesAnyPattern(relativePath, policy.controllerTestPatterns)
  ) {
    return [];
  }

  if (!INDEX_IMPORT_RE.test(source)) {
    return [];
  }

  return [
    `${relativePath}: controller tests must import implementation modules directly, not src/index.ts (contract/integration tests may import the entrypoint)`,
  ];
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function validateCrossPackageInternalImports(root) {
  const errors = [];
  const packagesDir = path.join(root, "packages");

  readDirRecursive(packagesDir, (filePath) => {
    if (!SOURCE_FILE_PATTERN.test(filePath) || filePath.includes("/test/")) {
      return;
    }

    const relativePath = toPosixPath(filePath.slice(root.length + 1));
    const source = readFileSync(filePath, "utf8");

    for (const violation of findCrossPackageInternalImportViolations(source)) {
      errors.push(`${relativePath}: ${violation}`);
    }
  });

  return errors;
}

/**
 * @param {string} root
 * @param {ArchitectureCheckPolicy} policy
 * @returns {string[]}
 */
export function validateControllerAlpineImports(root) {
  const errors = [];
  const packagesDir = path.join(root, "packages");

  readDirRecursive(packagesDir, (filePath) => {
    const relativePath = toPosixPath(filePath.slice(root.length + 1));
    if (!isControllerSourceFile(relativePath)) {
      return;
    }

    const source = readFileSync(filePath, "utf8");
    if (VALUE_ALPINE_IMPORT_RE.test(source)) {
      errors.push(
        `${relativePath}: controller modules must not import alpinejs at runtime (use import type or keep Alpine in plugin.ts)`
      );
    }
  });

  return errors;
}

/**
 * @param {string} root
 * @param {ArchitectureCheckPolicy} policy
 * @returns {string[]}
 */
export function validateConstructorSideEffects(root, policy) {
  const errors = [];
  const exceptions = new Set(policy.constructorSideEffectExceptions);
  const packagesDir = path.join(root, "packages");

  readDirRecursive(packagesDir, (filePath) => {
    const relativePath = toPosixPath(filePath.slice(root.length + 1));
    if (!isControllerSourceFile(relativePath) || exceptions.has(relativePath)) {
      return;
    }

    const source = readFileSync(filePath, "utf8");
    const bodies = extractConstructorBodies(source);

    for (const body of bodies) {
      const violations = findConstructorSideEffectViolations(body);
      if (violations.length > 0) {
        errors.push(
          `${relativePath}: constructor must not access browser globals or start timers (${violations.join(", ")})`
        );
      }
    }
  });

  return errors;
}

/**
 * @param {Record<string, unknown>} manifest
 * @returns {boolean}
 */
function hasControllerSubpathExport(manifest) {
  const exportsField = manifest.exports;
  if (!exportsField || typeof exportsField !== "object") {
    return false;
  }

  return Object.keys(exportsField).some(
    (key) => key === "./controller" || key.endsWith("/controller")
  );
}

/**
 * @param {string} root
 * @param {ArchitectureCheckPolicy} policy
 * @returns {string[]}
 */
export function validateControllerSurface(root, policy) {
  const errors = [];
  const packagesDir = path.join(root, "packages");
  const exceptions = new Set(policy.controllerExceptions);

  for (const pkg of publishablePackages(discoverPackages(packagesDir))) {
    if (exceptions.has(pkg.folder) || policy.privatePackages.includes(pkg.folder)) {
      continue;
    }

    const barrelPath = path.join(pkg.dir, "src", "index.ts");
    if (!existsSync(barrelPath)) {
      errors.push(`${pkg.name}: missing src/index.ts`);
      continue;
    }

    const barrel = readFileSync(barrelPath, "utf8");
    if (!(CONTROLLER_EXPORT_RE.test(barrel) || hasControllerSubpathExport(pkg.manifest))) {
      errors.push(
        `${pkg.name}: stateful package must export a public *Controller class from src/index.ts, expose a ./controller subpath, or be listed in ARCHITECTURE_CHECK_POLICY.controllerExceptions`
      );
    }
  }

  return errors;
}

/**
 * @param {string} root
 * @param {ArchitectureCheckPolicy} policy
 * @returns {string[]}
 */
export function validateUnitTestImports(root, policy) {
  const errors = [];
  const packagesDir = path.join(root, "packages");

  readDirRecursive(packagesDir, (filePath) => {
    if (!TEST_FILE_PATTERN.test(filePath)) {
      return;
    }

    const relativePath = toPosixPath(filePath.slice(root.length + 1));
    const source = readFileSync(filePath, "utf8");
    errors.push(...findUnitTestImportViolations(relativePath, source, policy));
  });

  return errors;
}

/**
 * @param {import("./repo-check.mjs").DiscoveredPackage[]} packages
 * @returns {Map<string, Set<string>>}
 */
export function buildWorkspaceDependencyGraph(packages) {
  const graph = new Map();

  for (const pkg of packages) {
    const deps = new Set();
    for (const field of DEPENDENCY_FIELDS) {
      const section = pkg.manifest[field];
      if (!section || typeof section !== "object") {
        continue;
      }

      for (const depName of Object.keys(section)) {
        if (depName.startsWith(SCOPE)) {
          deps.add(depName.slice(SCOPE.length));
        }
      }
    }
    graph.set(pkg.folder, deps);
  }

  return graph;
}

/**
 * @param {Map<string, Set<string>>} graph
 * @param {Set<string>} knownFolders
 * @returns {string[]}
 */
export function detectPackageCycles(graph, knownFolders) {
  const errors = [];
  const visiting = new Set();
  const visited = new Set();

  /**
   * @param {string} folder
   * @param {string[]} trail
   */
  function visit(folder, trail) {
    if (visiting.has(folder)) {
      errors.push(`circular package dependency detected: ${[...trail, folder].join(" -> ")}`);
      return;
    }

    if (visited.has(folder)) {
      return;
    }

    visiting.add(folder);
    const deps = graph.get(folder) ?? new Set();
    for (const dep of deps) {
      if (!knownFolders.has(dep)) {
        continue;
      }
      visit(dep, [...trail, folder]);
    }
    visiting.delete(folder);
    visited.add(folder);
  }

  for (const folder of graph.keys()) {
    visit(folder, []);
  }

  return errors;
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function validateDependencyDirection(root) {
  const errors = [];
  const packages = discoverPackages(path.join(root, "packages"));
  const graph = buildWorkspaceDependencyGraph(packages);
  const knownFolders = new Set(packages.map((pkg) => pkg.folder));

  const coreDeps = graph.get("core") ?? new Set();
  const featureDeps = [...coreDeps].filter((folder) => folder !== "core");
  if (featureDeps.length > 0) {
    errors.push(
      `@ailuracode/alpine-core must not depend on feature packages: [${featureDeps.join(", ")}]`
    );
  }

  errors.push(...detectPackageCycles(graph, knownFolders));
  return errors;
}

/**
 * @param {string} root
 * @returns {string[]}
 */
export function validateHeadlessCss(root) {
  validateHeadlessCssPolicy.readFile = (filePath) => readFileSync(filePath, "utf8");
  return validateHeadlessCssPolicy(root, readDirRecursive);
}

/**
 * @param {string} value
 * @returns {string}
 */
function toPosixPath(value) {
  return value.replace(/\\/g, "/");
}

/**
 * @param {ArchitectureCheckOptions} [options]
 * @returns {ArchitectureCheckResult}
 */
export function runArchitectureCheck(options = {}) {
  const root = options.root ?? defaultRoot;
  const packagesDir = options.packagesDir ?? path.join(root, "packages");
  const policy = options.policy ?? ARCHITECTURE_CHECK_POLICY;
  const packages = discoverPackages(packagesDir);
  const errors = [
    ...validateInternalBarrelExports(root, policy),
    ...validateCrossPackageInternalImports(root),
    ...validateControllerAlpineImports(root),
    ...validateConstructorSideEffects(root, policy),
    ...validateControllerSurface(root, policy),
    ...validateUnitTestImports(root, policy),
    ...validateDependencyDirection(root),
    ...validateHeadlessCss(root),
  ];

  return {
    ok: errors.length === 0,
    errors,
    packageCount: packages.length,
  };
}

function main() {
  const result = runArchitectureCheck();

  if (result.ok) {
    console.log(
      `architecture:check passed (${result.packageCount} packages, ${ARCHITECTURE_CHECK_POLICY.internalBarrelExceptions.length} internal-barrel exceptions)`
    );
    process.exit(0);
  }

  console.error("architecture:check failed:\n");
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
