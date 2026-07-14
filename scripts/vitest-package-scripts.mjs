import { existsSync } from "node:fs";
import path from "node:path";

const ROOT_CONFIG = "../../vitest.config.ts";
const VITEST_SCRIPT_KEYS = ["test", "test:watch", "test:coverage"];
const AMBIGUOUS_TEST_FILTER = /\s(?<![:/])test\s*$/;

/**
 * @typedef {object} PackageLike
 * @property {string} folder
 * @property {string} name
 * @property {string} dir
 * @property {Record<string, unknown>} manifest
 */

/**
 * @param {string} folder
 * @returns {boolean}
 */
export function packageHasLocalVitestConfig(folder, packagesDir) {
  return existsSync(path.join(packagesDir, folder, "vitest.config.ts"));
}

/**
 * @param {string} folder
 * @param {boolean} hasLocalConfig
 * @returns {Record<string, string>}
 */
export function expectedVitestScripts(folder) {
  const scope = `packages/${folder}`;

  return {
    test: `vitest run --config ${ROOT_CONFIG} ${scope}`,
    "test:watch": `vitest --config ${ROOT_CONFIG} ${scope}`,
    "test:coverage": `vitest run --coverage --config ${ROOT_CONFIG} ${scope}`,
  };
}

/**
 * @param {string | undefined} command
 * @returns {boolean}
 */
export function usesAmbiguousTestFilter(command) {
  if (typeof command !== "string" || !command.includes("vitest")) {
    return false;
  }

  return AMBIGUOUS_TEST_FILTER.test(command);
}

/**
 * @param {string | undefined} command
 * @param {string} folder
 * @param {boolean} hasLocalConfig
 * @returns {boolean}
 */
export function isScopedVitestCommand(command, folder, hasLocalConfig) {
  if (typeof command !== "string" || !command.includes("vitest")) {
    return true;
  }

  if (usesAmbiguousTestFilter(command)) {
    return false;
  }

  if (hasLocalConfig) {
    return command.includes(ROOT_CONFIG) && command.includes(`packages/${folder}`);
  }

  return command.includes(`packages/${folder}`);
}

/**
 * @param {PackageLike} pkg
 * @param {string} scriptName
 * @param {string} command
 * @param {boolean} hasLocalConfig
 * @param {Record<string, string>} expected
 * @returns {string[]}
 */
function validatePackageVitestScript(pkg, scriptName, command, hasLocalConfig, expected) {
  if (usesAmbiguousTestFilter(command)) {
    return [
      `${pkg.name}: scripts.${scriptName} uses ambiguous positional filter "test" — use packages/${pkg.folder} or a package-owned vitest.config.ts`,
    ];
  }

  if (!isScopedVitestCommand(command, pkg.folder, hasLocalConfig)) {
    const hint = `expected "${expected[scriptName]}"`;
    return [`${pkg.name}: scripts.${scriptName} is not scoped to the package (${hint})`];
  }

  if (command !== expected[scriptName]) {
    return [
      `${pkg.name}: scripts.${scriptName} must match the standardized contract ("${expected[scriptName]}")`,
    ];
  }

  return [];
}

/**
 * @param {PackageLike} pkg
 * @param {string} packagesDir
 * @returns {string[]}
 */
function validatePackageVitestScriptsForPackage(pkg, packagesDir) {
  const scripts = pkg.manifest.scripts;
  if (!scripts || typeof scripts !== "object") {
    return [];
  }

  const hasLocalConfig = packageHasLocalVitestConfig(pkg.folder, packagesDir);
  const expected = expectedVitestScripts(pkg.folder);
  const errors = [];

  for (const scriptName of VITEST_SCRIPT_KEYS) {
    const command = scripts[scriptName];
    if (typeof command !== "string") {
      continue;
    }

    errors.push(...validatePackageVitestScript(pkg, scriptName, command, hasLocalConfig, expected));
  }

  return errors;
}

/**
 * @param {PackageLike[]} packages
 * @param {string} packagesDir
 * @returns {string[]}
 */
export function validatePackageVitestScripts(packages, packagesDir) {
  const errors = [];

  for (const pkg of packages) {
    errors.push(...validatePackageVitestScriptsForPackage(pkg, packagesDir));
  }

  return errors;
}
