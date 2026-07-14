/**
 * @fileoverview Vitest project routing for ALP-131.
 *
 * Builds Node, happy-dom, and package overlay projects from the live test
 * environment inventory. Files classified as `node` stay on simulated DOM when
 * their source still references browser globals — ALP-133 migrates those tests.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildTestEnvironmentInventory,
  packageDefaultEnvironment,
  packageFromPath,
  readVitestEnvironmentDirective,
} from "./test-environment-classify.mjs";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Packages that require jsdom APIs and own a root Vitest project. */
export const JSDOM_PROJECT_PACKAGES = ["collection", "scroll", "sidebar", "theme", "ui"];

/** Packages with happy-dom overlay projects and package-local setup. */
export const HAPPY_DOM_PROJECT_PACKAGES = ["media", "realtime"];

/** Every package that contributes a `defineProject` config to the root workspace. */
export const VITEST_PROJECT_PACKAGES = [...JSDOM_PROJECT_PACKAGES, ...HAPPY_DOM_PROJECT_PACKAGES];

const SHARED_TEST_EXCLUDE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/e2e/**",
  "**/playwright-report/**",
  "**/test-results/**",
];

/** Browser globals and harness imports that require a simulated DOM today. */
const RUNTIME_DOM_PATTERNS = [
  /\bdocument\./,
  /\bwindow\./,
  /Object\.defineProperty\(\s*document/,
  /Object\.defineProperty\(\s*window/,
  /\btoBe\(document\)/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bnavigator\b/,
  /\bmatchMedia\b/,
  /\bIntersectionObserver\b/,
  /\bResizeObserver\b/,
  /from\s+["']\.\/setup(?:\.js)?["']/,
  /from\s+["'][^"']*\/test\/setup(?:\.js)?["']/,
  /x-data|x-init|x-show|x-text|@click/,
  /\bstartAlpine\s*\(/,
  /\bAlpine\.start\s*\(/,
  /\bcreateMagicHarness\s*\(/,
  /\bcreateTheme\s*\(/,
  /\bcreateScroll\s*\(/,
  /\bcreateSidebar\s*\(/,
  /\bbindScrollElement\s*\(/,
  /\bcreateJsonTree\b/,
  /\.querySelector\b/,
  /KeyboardEvent/,
  /\.mount\s*\(/,
  /\.innerHTML\s*=/,
  /\bgetBoundingClientRect\s*\(/,
  /\.focus\s*\(|\.blur\s*\(/,
  /\bisBrowser\s*\(/,
  /\bsafeWindow\s*\(/,
  /globalThis\.window/,
  /\bcreateAdapterBadge\b/,
  /\bsafeMatchMedia\s*\(/,
  /@floating-ui|computePosition|autoUpdate/,
  /\bEmbla|embla/i,
];

/**
 * @param {string} content
 * @param {import('./test-environment-classify.mjs').ClassifiedTestFile} file
 * @returns {boolean}
 */
function isSsrShadowTest(content, file) {
  if (file.layer !== "contract" && !file.path.includes("ssr.")) {
    return false;
  }

  return (
    /Object\.defineProperty\(globalThis,\s*["']window["']/.test(content) &&
    /Object\.defineProperty\(globalThis,\s*["']document["']/.test(content)
  );
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
 * @returns {"node"|"happy-dom"|"jsdom"}
 */
export function resolveVitestRuntimeEnvironment(file, content, packagesDir) {
  const directive = readVitestEnvironmentDirective(content);
  if (directive) {
    return directive;
  }

  if (isSsrShadowTest(content, file)) {
    return "node";
  }

  const packageEnv = packageDefaultEnvironment(file.package, packagesDir);
  const needsDom =
    file.layer === "integration" ||
    file.layer === "accessibility" ||
    RUNTIME_DOM_PATTERNS.some((pattern) => pattern.test(content));

  if (needsDom) {
    if (packageEnv === "jsdom") {
      return "jsdom";
    }
    return "happy-dom";
  }

  if (file.targetEnvironment === "jsdom") {
    return "jsdom";
  }

  return "node";
}

/**
 * @param {string} root
 * @param {string} packagesDir
 * @returns {Map<string, "node"|"happy-dom"|"jsdom">}
 */
export function buildVitestRuntimeEnvironmentMap(root, packagesDir) {
  /** @type {Map<string, "node"|"happy-dom"|"jsdom">} */
  const routing = new Map();

  for (const file of vitestInventoryFiles(root)) {
    const absolutePath = path.join(root, file.path);
    const content = readFileSync(absolutePath, "utf8");
    routing.set(file.path, resolveVitestRuntimeEnvironment(file, content, packagesDir));
  }

  return routing;
}

/**
 * @param {Map<string, "node"|"happy-dom"|"jsdom">} routing
 * @param {"node"|"happy-dom"|"jsdom"} environment
 * @returns {string[]}
 */
function includesForEnvironment(routing, environment) {
  return [...routing.entries()]
    .filter(([, runtimeEnvironment]) => runtimeEnvironment === environment)
    .map(([filePath]) => filePath);
}

/**
 * @param {string} root
 * @param {"node"|"happy-dom"|"jsdom"} environment
 * @returns {string[]}
 */
export function vitestIncludesForEnvironment(root, environment) {
  const packagesDir = path.join(root, "packages");
  const routing = buildVitestRuntimeEnvironmentMap(root, packagesDir);
  return includesForEnvironment(routing, environment);
}

/**
 * @param {string} pkg
 * @param {"node"|"happy-dom"|"jsdom"} environment
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
 * @param {string} filePath
 * @param {string} root
 * @returns {boolean}
 */
function isPackageOverlayFile(filePath, root) {
  const pkg = packageFromPath(path.join(root, filePath), root);
  if (JSDOM_PROJECT_PACKAGES.includes(pkg)) {
    return true;
  }
  if (HAPPY_DOM_PROJECT_PACKAGES.includes(pkg)) {
    return true;
  }
  return false;
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
        name: "happy-dom",
        environment: "happy-dom",
        include: happyDomIncludes,
        exclude: SHARED_TEST_EXCLUDE,
        setupFiles: [path.join(root, "test/setup.ts")],
      },
    },
    ...VITEST_PROJECT_PACKAGES.map((pkg) => `packages/${pkg}`),
  ];
}
