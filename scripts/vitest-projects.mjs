/**
 * @fileoverview Vitest project routing for ALP-131 / ALP-133.
 *
 * Builds Node, happy-dom, and package overlay projects from the live test
 * environment inventory. Runtime routing follows classification signals and
 * only keeps tests on simulated DOM when their source genuinely needs it.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildTestEnvironmentInventory,
  detectDomSignals,
  packageDefaultEnvironment,
  packageFromPath,
  readVitestEnvironmentDirective,
} from "./test-environment-classify.mjs";
import {
  domProjectRuntimeSettings,
  nodeProjectRuntimeSettings,
} from "./vitest-runtime-settings.mjs";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Packages with happy-dom overlay projects and optional package-local setup. */
export const HAPPY_DOM_PROJECT_PACKAGES = [
  "collection",
  "scroll",
  "sidebar",
  "theme",
  "ui",
  "media",
  "realtime",
];

/** Every package that contributes a `defineProject` config to the root workspace. */
export const VITEST_PROJECT_PACKAGES = HAPPY_DOM_PROJECT_PACKAGES;

const SHARED_TEST_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/e2e/**",
  "**/playwright-report/**",
  "**/test-results/**",
];

/**
 * DOM usage that `detectDomSignals` does not cover but still requires a
 * simulated browser environment.
 */
const SUPPLEMENTAL_DOM_PATTERNS = [
  /\bdocument\.dispatchEvent\b/,
  /\btoBe\(document\)/,
  /\bnew KeyboardEvent\b/,
  /\bstartAlpine\s*\(/,
  /\bAlpine\.start\s*\(/,
  /from\s+["']\.\/setup(?:\.js)?["']/,
  /from\s+["'][^"']*\/test\/setup(?:\.js)?["']/,
  /\bcreateJsonTree\b/,
  /\bcreateAdapterBadge\b/,
  /\.querySelector\b/,
  /\bHTMLTextAreaElement\b/,
  /document\.execCommand/,
  /@floating-ui|computePosition|autoUpdate/,
  /\bEmbla|embla/i,
];

/**
 * @param {string} content
 * @param {import('./test-environment-classify.mjs').ClassifiedTestFile} file
 * @returns {boolean}
 */
function isSsrNoDomTest(content, file) {
  if (file.layer !== "contract" && !file.path.includes("ssr.")) {
    return false;
  }

  const shadowsWithDefineProperty =
    /Object\.defineProperty\(globalThis,\s*["']window["']/.test(content) &&
    /Object\.defineProperty\(globalThis,\s*["']document["']/.test(content);
  const shadowsWithStubGlobal =
    /vi\.stubGlobal\(\s*["']window["']/.test(content) &&
    /vi\.stubGlobal\(\s*["']document["']/.test(content);

  return shadowsWithDefineProperty || shadowsWithStubGlobal;
}

/**
 * @param {import('./test-environment-classify.mjs').ClassifiedTestFile} file
 * @param {string} content
 * @returns {boolean}
 */
function needsSimulatedDom(file, content) {
  if (file.layer === "integration") {
    return true;
  }

  if (isSsrNoDomTest(content, file)) {
    return false;
  }

  if (detectDomSignals(content).length > 0) {
    return true;
  }

  return SUPPLEMENTAL_DOM_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * @param {string} root
 * @returns {import('./test-environment-classify.mjs').ClassifiedTestFile[]}
 */
function vitestInventoryFiles(root) {
  return buildTestEnvironmentInventory(root).files.filter((file) => file.layer !== "e2e");
}

/**
 * @param {import('./test-environment-classify.mjs').ClassifiedTestFile} file
 * @param {string} content
 * @param {string} packagesDir
 * @returns {"node"|"happy-dom"}
 */
export function resolveVitestRuntimeEnvironment(file, content, packagesDir) {
  const directive = readVitestEnvironmentDirective(content);
  if (directive) {
    return directive;
  }

  const packageEnv = packageDefaultEnvironment(file.package, packagesDir);

  if (!needsSimulatedDom(file, content)) {
    return "node";
  }

  if (packageEnv === "happy-dom") {
    return "happy-dom";
  }

  return "happy-dom";
}

/**
 * @param {string} root
 * @param {string} packagesDir
 * @returns {Map<string, "node"|"happy-dom">}
 */
export function buildVitestRuntimeEnvironmentMap(root, packagesDir) {
  /** @type {Map<string, "node"|"happy-dom">} */
  const routing = new Map();

  for (const file of vitestInventoryFiles(root)) {
    const absolutePath = path.join(root, file.path);
    const content = readFileSync(absolutePath, "utf8");
    routing.set(file.path, resolveVitestRuntimeEnvironment(file, content, packagesDir));
  }

  return routing;
}

/**
 * @param {Map<string, "node"|"happy-dom">} routing
 * @param {"node"|"happy-dom"} environment
 * @returns {string[]}
 */
function includesForEnvironment(routing, environment) {
  return [...routing.entries()]
    .filter(([, runtimeEnvironment]) => runtimeEnvironment === environment)
    .map(([filePath]) => filePath);
}

/**
 * @param {string} root
 * @param {"node"|"happy-dom"} environment
 * @returns {string[]}
 */
export function vitestIncludesForEnvironment(root, environment) {
  const packagesDir = path.join(root, "packages");
  const routing = buildVitestRuntimeEnvironmentMap(root, packagesDir);
  return includesForEnvironment(routing, environment);
}

/**
 * @param {string} pkg
 * @param {"node"|"happy-dom"} environment
 * @param {string} [root]
 * @returns {string[]}
 */
export function packageProjectIncludes(pkg, environment, root = defaultRoot) {
  const packagesDir = path.join(root, "packages");
  const routing = buildVitestRuntimeEnvironmentMap(root, packagesDir);

  return [...routing.entries()]
    .filter(
      ([filePath, runtimeEnvironment]) =>
        packageFromPath(path.join(root, filePath), root) === pkg &&
        runtimeEnvironment === environment
    )
    .map(([filePath]) => filePath);
}

/**
 * Package overlay configs resolve `include` relative to `packages/<pkg>/`.
 *
 * @param {string} pkg
 * @param {"node"|"happy-dom"} environment
 * @param {string} [root]
 * @returns {string[]}
 */
export function packageProjectIncludesRelative(pkg, environment, root = defaultRoot) {
  const prefix = `packages/${pkg}/`;

  return packageProjectIncludes(pkg, environment, root).map((filePath) => {
    if (!filePath.startsWith(prefix)) {
      throw new Error(`Expected ${filePath} to start with ${prefix}`);
    }

    return filePath.slice(prefix.length);
  });
}

/**
 * @param {string} filePath
 * @param {string} root
 * @returns {boolean}
 */
function isPackageOverlayFile(filePath, root) {
  const pkg = packageFromPath(path.join(root, filePath), root);
  return HAPPY_DOM_PROJECT_PACKAGES.includes(pkg);
}

/**
 * @param {string} root
 * @returns {import('vitest/config').UserProjectConfig[]}
 */
export function buildRootVitestProjects(root = defaultRoot) {
  const packagesDir = path.join(root, "packages");
  const routing = buildVitestRuntimeEnvironmentMap(root, packagesDir);
  const nodeIncludes = includesForEnvironment(routing, "node");
  const happyDomIncludes = includesForEnvironment(routing, "happy-dom").filter(
    (filePath) => !isPackageOverlayFile(filePath, root)
  );

  return [
    {
      extends: true,
      test: {
        ...nodeProjectRuntimeSettings(),
        name: "node",
        environment: "node",
        include: nodeIncludes,
        exclude: SHARED_TEST_EXCLUDE,
        setupFiles: [path.join(root, "test/setup.node.ts")],
      },
    },
    {
      extends: true,
      test: {
        ...domProjectRuntimeSettings(),
        name: "happy-dom",
        environment: "happy-dom",
        include: happyDomIncludes,
        exclude: SHARED_TEST_EXCLUDE,
        setupFiles: [path.join(root, "test/setup/happy-dom.ts")],
      },
    },
    ...VITEST_PROJECT_PACKAGES.map((pkg) => `packages/${pkg}`),
  ];
}
