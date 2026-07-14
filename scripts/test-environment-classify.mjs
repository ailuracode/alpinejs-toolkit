#!/usr/bin/env node
/**
 * @fileoverview Classifies Vitest and Playwright tests by responsibility layer
 * and target runtime environment (ALP-130).
 *
 * Usage:
 *   node scripts/test-environment-classify.mjs [--write] [--output <dir>]
 *   pnpm run test:classify
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { packageHasLocalVitestConfig } from "./vitest-package-scripts.mjs";

const VITEST_FILE_RE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const E2E_FILE_RE = /\/e2e\/.*\.spec\.[cm]?[jt]sx?$/;
const VITEST_ENV_DIRECTIVE_RE = /@vitest-environment\s+([a-z-]+)/;

/** @typedef {'controller'|'contract'|'integration'|'accessibility'|'utility'|'repository'|'e2e'} TestLayer */
/** @typedef {'node'|'happy-dom'|'jsdom'|'playwright'} TargetEnvironment */
/** @typedef {'filename'|'content'|'package-config'|'vitest-directive'|'path'} ClassificationSource */

/**
 * @typedef {object} ClassifiedTestFile
 * @property {string} path
 * @property {string} package
 * @property {TestLayer} layer
 * @property {TargetEnvironment} targetEnvironment
 * @property {ClassificationSource} source
 * @property {string[]} signals
 * @property {boolean} hasPlaywrightSibling
 */

/**
 * @typedef {object} PackageOverlapSummary
 * @property {string} package
 * @property {number} vitestFiles
 * @property {number} e2eFiles
 * @property {string[]} vitestIntegration
 * @property {string[]} e2eSpecs
 * @property {'none'|'complementary'|'review'} overlap
 * @property {string} note
 */

/**
 * @typedef {object} TestEnvironmentInventory
 * @property {string} generatedAt
 * @property {string} issue
 * @property {number} vitestFileCount
 * @property {number} e2eFileCount
 * @property {Record<TargetEnvironment, number>} environmentCounts
 * @property {Record<TestLayer, number>} layerCounts
 * @property {ClassifiedTestFile[]} files
 * @property {PackageOverlapSummary[]} overlapByPackage
 */

const LAYER_FILENAME_RULES = [
  { layer: "controller", pattern: /(?:^|\/)controller\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "controller", pattern: /(?:^|\/)base-controller\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "controller", pattern: /(?:^|\/)controller-id\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "controller", pattern: /(?:^|\/)test\/controller\/[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "controller", pattern: /Controller\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "contract", pattern: /(?:^|\/)contract\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "contract", pattern: /(?:^|\/)encapsulation\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "contract", pattern: /(?:^|\/)ssr\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "accessibility", pattern: /(?:^|\/)accessibility\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "accessibility", pattern: /(?:^|\/)a11y\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  {
    layer: "integration",
    pattern: /(?:^|\/)alpine(?:\.|-)integration\.(?:test|spec)\.[cm]?[jt]sx?$/,
  },
  {
    layer: "integration",
    pattern: /(?:^|\/)alpine(?:\.|-)reactivity\.(?:test|spec)\.[cm]?[jt]sx?$/,
  },
  {
    layer: "integration",
    pattern: /(?:^|\/)directive\.integration\.(?:test|spec)\.[cm]?[jt]sx?$/,
  },
  { layer: "integration", pattern: /(?:^|\/)plugin\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "integration", pattern: /(?:^|\/)magic\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "integration", pattern: /(?:^|\/)store\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "integration", pattern: /(?:^|\/)adapter\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "integration", pattern: /(?:^|\/)devtools\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "integration", pattern: /(?:^|\/)demo-integration\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "integration", pattern: /(?:^|\/)demo-markup\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "utility", pattern: /(?:^|\/)parse\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "utility", pattern: /(?:^|\/)utils?\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "utility", pattern: /(?:^|\/)backoff\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "utility", pattern: /(?:^|\/)reconnect\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "utility", pattern: /(?:^|\/)inference\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  { layer: "utility", pattern: /(?:^|\/)paths?\.(?:test|spec)\.[cm]?[jt]sx?$/ },
  {
    layer: "repository",
    pattern: /^test\/(?:architecture-check|pack-check|vitest-package-scripts)\.test\.[cm]?[jt]sx?$/,
  },
];

const DOM_SIGNAL_RES = [
  { signal: "Alpine.start", pattern: /\bAlpine\.start\s*\(/ },
  { signal: "startAlpine", pattern: /\bstartAlpine\s*\(/ },
  {
    signal: "document",
    pattern:
      /\bdocument\.(?:body|documentElement|getElementById|querySelector|createElement|addEventListener)/,
  },
  {
    signal: "window",
    pattern:
      /\bwindow\.(?:addEventListener|removeEventListener|innerWidth|ontouchstart|localStorage)/,
  },
  { signal: "localStorage", pattern: /\blocalStorage\b/ },
  { signal: "innerHTML", pattern: /\.innerHTML\s*=/ },
  { signal: "x-data", pattern: /x-data|x-init|x-show|x-text|@click/ },
  { signal: "HTMLElement", pattern: /\bHTMLElement\b/ },
  { signal: "getBoundingClientRect", pattern: /\bgetBoundingClientRect\s*\(/ },
  { signal: "focus", pattern: /\.focus\s*\(|\.blur\s*\(/ },
  { signal: "matchMedia", pattern: /\bmatchMedia\s*\(/ },
  { signal: "IntersectionObserver", pattern: /\bIntersectionObserver\b/ },
  { signal: "ResizeObserver", pattern: /\bResizeObserver\b/ },
  { signal: "portal-root", pattern: /portal|teleport|x-teleport/i },
  { signal: "Floating UI", pattern: /@floating-ui|computePosition|autoUpdate/ },
  { signal: "Embla", pattern: /\bEmbla|embla/i },
];

const NODE_SIGNAL_RES = [
  {
    signal: "controller-only-import",
    pattern: /from\s+["']\.\.\/src\/controller(?:\/[^"']+)?\.js["']/,
  },
  { signal: "ssr-import", pattern: /imports without (?:DOM|browser)/i },
  { signal: "query-client", pattern: /\bcreateQueryClient\s*\(/ },
  { signal: "vanilla-adapter", pattern: /\bvanillaQueryAdapter\b/ },
  { signal: "magic-harness", pattern: /\bcreateMagicHarness\s*\(/ },
  { signal: "no-alpine-import", pattern: /^(?!.*from\s+["']alpinejs["']).*$/s },
];

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @param {string} root
 * @param {(filePath: string) => void} visit
 */
function walkTestFiles(root, visit) {
  const roots = [
    path.join(root, "packages"),
    path.join(root, "test"),
    path.join(root, "apps", "demo", "test"),
  ];

  for (const base of roots) {
    if (!existsSync(base)) {
      continue;
    }
    walkDir(base, visit);
  }
}

/**
 * @param {string} dir
 * @param {(filePath: string) => void} visit
 */
function walkDir(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      walkDir(fullPath, visit);
      continue;
    }

    if (VITEST_FILE_RE.test(entry.name) && !E2E_FILE_RE.test(fullPath)) {
      visit(fullPath);
    }

    if (E2E_FILE_RE.test(fullPath)) {
      visit(fullPath);
    }
  }
}

/**
 * @param {string} filePath
 * @param {string} root
 * @returns {string}
 */
export function packageFromPath(filePath, root) {
  const relative = path.relative(root, filePath).replaceAll("\\", "/");
  const match = relative.match(/^packages\/([^/]+)\//);
  if (match) {
    return match[1];
  }
  if (relative.startsWith("test/")) {
    return "repository";
  }
  if (relative.startsWith("apps/demo/")) {
    return "demo";
  }
  return "unknown";
}

/**
 * @param {string} filePath
 * @returns {TestLayer}
 */
export function inferLayerFromFilename(filePath) {
  const normalized = filePath.replaceAll("\\", "/");

  if (E2E_FILE_RE.test(normalized)) {
    return "e2e";
  }

  for (const rule of LAYER_FILENAME_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.layer;
    }
  }

  if (normalized.includes("/adapters/")) {
    return "utility";
  }

  if (normalized.includes("/alpine/")) {
    return "integration";
  }

  return "utility";
}

/**
 * @param {string} content
 * @returns {string[]}
 */
export function detectDomSignals(content) {
  const signals = [];
  for (const rule of DOM_SIGNAL_RES) {
    if (rule.pattern.test(content)) {
      signals.push(rule.signal);
    }
  }
  return signals;
}

/**
 * @param {string} content
 * @returns {string[]}
 */
export function detectNodeSignals(content) {
  const signals = [];
  for (const rule of NODE_SIGNAL_RES) {
    if (rule.pattern.test(content)) {
      signals.push(rule.signal);
    }
  }
  return signals;
}

/**
 * @param {string} content
 * @returns {TargetEnvironment | null}
 */
export function readVitestEnvironmentDirective(content) {
  const match = content.match(VITEST_ENV_DIRECTIVE_RE);
  if (!match) {
    return null;
  }
  const value = match[1];
  if (value === "node" || value === "happy-dom" || value === "jsdom") {
    return value;
  }
  return null;
}

/**
 * @param {string} pkg
 * @param {string} packagesDir
 * @returns {TargetEnvironment | null}
 */
export function packageDefaultEnvironment(pkg, packagesDir) {
  if (pkg === "repository" || pkg === "demo" || pkg === "unknown") {
    return null;
  }

  if (!packageHasLocalVitestConfig(pkg, packagesDir)) {
    return null;
  }

  const configPath = path.join(packagesDir, pkg, "vitest.config.ts");
  const config = readFileSync(configPath, "utf8");
  if (config.includes('environment: "jsdom"') || config.includes("environment: 'jsdom'")) {
    return "jsdom";
  }
  if (config.includes('environment: "happy-dom"') || config.includes("environment: 'happy-dom'")) {
    return "happy-dom";
  }
  return null;
}

/**
 * @param {TestLayer} layer
 * @returns {boolean}
 */
function isNodeEligibleLayer(layer) {
  return (
    layer === "controller" ||
    layer === "utility" ||
    layer === "contract" ||
    layer === "repository" ||
    layer === "accessibility"
  );
}

/**
 * @param {object} input
 * @param {TestLayer} input.layer
 * @param {string} input.relativePath
 * @param {string[]} input.domSignals
 * @param {string[]} input.nodeSignals
 * @param {TargetEnvironment | null} input.packageEnv
 * @param {string} input.pkg
 * @returns {{ targetEnvironment: TargetEnvironment, source: ClassificationSource, signals: string[] }}
 */
function resolveTargetEnvironment({
  layer,
  relativePath,
  domSignals,
  nodeSignals,
  packageEnv,
  pkg,
}) {
  if (layer === "contract" && relativePath.includes("ssr.")) {
    return { targetEnvironment: "node", source: "filename", signals: ["ssr-contract"] };
  }

  if (layer === "controller" && domSignals.length === 0) {
    return { targetEnvironment: "node", source: "filename", signals: [`layer:${layer}`] };
  }

  if (domSignals.length > 0) {
    return {
      targetEnvironment: packageEnv ?? "happy-dom",
      source: "content",
      signals: domSignals,
    };
  }

  if (isNodeEligibleLayer(layer) && nodeSignals.length > 0) {
    return { targetEnvironment: "node", source: "content", signals: nodeSignals };
  }

  if (layer === "integration" || layer === "accessibility") {
    return {
      targetEnvironment: packageEnv ?? "happy-dom",
      source: "filename",
      signals: [`layer:${layer}`],
    };
  }

  if (isNodeEligibleLayer(layer)) {
    return { targetEnvironment: "node", source: "filename", signals: [`layer:${layer}`] };
  }

  if (packageEnv) {
    return {
      targetEnvironment: packageEnv,
      source: "package-config",
      signals: [`package:${pkg}`],
    };
  }

  return {
    targetEnvironment: "happy-dom",
    source: "filename",
    signals: ["default-root-happy-dom"],
  };
}

/**
 * @param {object} input
 * @param {string} input.filePath
 * @param {string} input.content
 * @param {string} input.root
 * @param {string} input.packagesDir
 * @returns {ClassifiedTestFile}
 */
export function classifyTestFile({ filePath, content, root, packagesDir }) {
  const relativePath = path.relative(root, filePath).replaceAll("\\", "/");
  const pkg = packageFromPath(filePath, root);
  const layer = inferLayerFromFilename(relativePath);

  if (layer === "e2e") {
    return {
      path: relativePath,
      package: pkg,
      layer,
      targetEnvironment: "playwright",
      source: "path",
      signals: ["e2e-path"],
      hasPlaywrightSibling: true,
    };
  }

  const directive = readVitestEnvironmentDirective(content);
  if (directive) {
    return {
      path: relativePath,
      package: pkg,
      layer,
      targetEnvironment: directive,
      source: "vitest-directive",
      signals: [`@vitest-environment ${directive}`],
      hasPlaywrightSibling: false,
    };
  }

  const domSignals = detectDomSignals(content);
  const nodeSignals = detectNodeSignals(content);
  const packageEnv = packageDefaultEnvironment(pkg, packagesDir);
  const resolved = resolveTargetEnvironment({
    layer,
    relativePath,
    domSignals,
    nodeSignals,
    packageEnv,
    pkg,
  });

  return {
    path: relativePath,
    package: pkg,
    layer,
    targetEnvironment: resolved.targetEnvironment,
    source: resolved.source,
    signals: resolved.signals,
    hasPlaywrightSibling: false,
  };
}

/**
 * @param {string} root
 * @returns {ClassifiedTestFile[]}
 */
export function discoverAndClassifyTests(root = defaultRoot) {
  const packagesDir = path.join(root, "packages");
  /** @type {ClassifiedTestFile[]} */
  const files = [];

  walkTestFiles(root, (filePath) => {
    const content = readFileSync(filePath, "utf8");
    files.push(classifyTestFile({ filePath, content, root, packagesDir }));
  });

  files.sort((a, b) => a.path.localeCompare(b.path));

  const e2ePackages = new Set(
    files.filter((file) => file.layer === "e2e").map((file) => file.package)
  );
  for (const file of files) {
    if (file.layer !== "e2e") {
      file.hasPlaywrightSibling = e2ePackages.has(file.package);
    }
  }

  return files;
}

/**
 * @param {ClassifiedTestFile[]} files
 * @returns {PackageOverlapSummary[]}
 */
export function summarizeOverlapByPackage(files) {
  /** @type {Map<string, ClassifiedTestFile[]>} */
  const byPackage = new Map();

  for (const file of files) {
    if (file.package === "repository" || file.package === "demo" || file.package === "unknown") {
      continue;
    }
    const list = byPackage.get(file.package) ?? [];
    list.push(file);
    byPackage.set(file.package, list);
  }

  /** @type {PackageOverlapSummary[]} */
  const summaries = [];

  for (const [pkg, pkgFiles] of [...byPackage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const vitestFiles = pkgFiles.filter((file) => file.layer !== "e2e");
    const e2eFiles = pkgFiles.filter((file) => file.layer === "e2e");
    const vitestIntegration = vitestFiles
      .filter((file) => file.layer === "integration" || file.layer === "accessibility")
      .map((file) => file.path);
    const e2eSpecs = e2eFiles.map((file) => file.path);

    /** @type {'none'|'complementary'|'review'} */
    let overlap = "none";
    let note = "Vitest only — no Playwright project.";

    if (e2eFiles.length > 0 && vitestIntegration.length === 0) {
      overlap = "complementary";
      note = "Browser behavior validated in Playwright; Vitest covers controller/contract layers.";
    } else if (e2eFiles.length > 0 && vitestIntegration.length > 0) {
      overlap = "complementary";
      note =
        "DOM integration tests validate Alpine registration and reactivity; Playwright validates real focus, layout, and browser APIs. Keep both unless the same public contract is asserted twice.";
    } else if (vitestIntegration.length > 0) {
      overlap = "review";
      note =
        "Simulated DOM integration without Playwright — confirm critical browser behavior is not missing from E2E backlog.";
    }

    summaries.push({
      package: pkg,
      vitestFiles: vitestFiles.length,
      e2eFiles: e2eFiles.length,
      vitestIntegration,
      e2eSpecs,
      overlap,
      note,
    });
  }

  return summaries;
}

/**
 * @param {ClassifiedTestFile[]} files
 * @returns {TestEnvironmentInventory}
 */
export function buildInventory(files) {
  /** @type {Record<TargetEnvironment, number>} */
  const environmentCounts = { node: 0, "happy-dom": 0, jsdom: 0, playwright: 0 };
  /** @type {Record<TestLayer, number>} */
  const layerCounts = {
    controller: 0,
    contract: 0,
    integration: 0,
    accessibility: 0,
    utility: 0,
    repository: 0,
    e2e: 0,
  };

  for (const file of files) {
    environmentCounts[file.targetEnvironment] += 1;
    layerCounts[file.layer] += 1;
  }

  const vitestFileCount = files.filter((file) => file.layer !== "e2e").length;
  const e2eFileCount = files.filter((file) => file.layer === "e2e").length;

  return {
    generatedAt: new Date().toISOString(),
    issue: "ALP-130",
    vitestFileCount,
    e2eFileCount,
    environmentCounts,
    layerCounts,
    files,
    overlapByPackage: summarizeOverlapByPackage(files),
  };
}

/**
 * @param {string} root
 * @returns {TestEnvironmentInventory}
 */
export function buildTestEnvironmentInventory(root = defaultRoot) {
  return buildInventory(discoverAndClassifyTests(root));
}

/**
 * @param {TestEnvironmentInventory} inventory
 * @returns {string}
 */
export function renderInventoryMarkdown(inventory) {
  const lines = [
    "# Test environment inventory",
    "",
    "Classification for [ALP-130](https://linear.app/ailuracode/issue/ALP-130/classify-tests-by-node-simulated-dom-and-real-browser-responsibility) under epic [ALP-127](https://linear.app/ailuracode/issue/ALP-127/epic-optimize-vitest-performance-and-test-environment-layering).",
    "",
    "## Summary",
    "",
    `- Generated: ${inventory.generatedAt}`,
    `- Vitest files: ${inventory.vitestFileCount}`,
    `- Playwright E2E files: ${inventory.e2eFileCount}`,
    "",
    "### Target environment (Vitest + E2E)",
    "",
    "| Environment | Files | Role |",
    "| --- | ---: | --- |",
    `| \`node\` | ${inventory.environmentCounts.node} | Controller, cache, parsing, SSR import, repository checks |`,
    `| \`happy-dom\` | ${inventory.environmentCounts["happy-dom"]} | Alpine stores, directives, simulated DOM (root default) |`,
    `| \`jsdom\` | ${inventory.environmentCounts.jsdom} | Packages that require jsdom APIs (\`theme\`, \`sidebar\`, \`scroll\`, \`collection\`, \`ui\`) |`,
    `| \`playwright\` | ${inventory.environmentCounts.playwright} | Real browser focus, layout, keyboard, permissions |`,
    "",
    "### Responsibility layer",
    "",
    "| Layer | Files |",
    "| --- | ---: |",
  ];

  for (const [layer, count] of Object.entries(inventory.layerCounts)) {
    lines.push(`| \`${layer}\` | ${count} |`);
  }

  lines.push(
    "",
    "## Layer conventions",
    "",
    "| Layer | Filename pattern | Harness | Target environment |",
    "| --- | --- | --- | --- |",
    "| Controller | `controller.test.ts`, `controller.spec.ts` | Direct module imports | `node` |",
    "| Contract | `contract.*`, `encapsulation.*`, `ssr.*` | Package entrypoint or built surface | `node` (SSR) or DOM when validating browser helpers |",
    "| Integration | `plugin.*`, `alpine.integration.*`, `adapter.*`, `magic.*` | `startAlpine()` or real Alpine | `happy-dom` / package `jsdom` |",
    "| Accessibility | `accessibility.*`, `a11y.*` | Controller or Alpine + DOM assertions | `node` when metadata-only; DOM when focus/roles are asserted |",
    "| Utility | `parse.*`, `utils.*`, adapter unit tests | Direct modules | `node` |",
    "| Repository | `test/architecture-check.test.ts`, etc. | Node scripts | `node` |",
    "| E2E | `packages/<pkg>/e2e/*.spec.ts` | Playwright fixtures | `playwright` |",
    "",
    "## Regenerate",
    "",
    "```bash",
    "pnpm run test:classify",
    "```",
    "",
    "Machine-readable output: `benchmarks/test-environment-inventory.json`.",
    "",
    "## Per-package overlap (Vitest vs Playwright)",
    "",
    "| Package | Vitest | E2E | Overlap | Note |",
    "| --- | ---: | ---: | --- | --- |"
  );

  for (const summary of inventory.overlapByPackage) {
    lines.push(
      `| \`${summary.package}\` | ${summary.vitestFiles} | ${summary.e2eFiles} | ${summary.overlap} | ${summary.note} |`
    );
  }

  lines.push(
    "",
    "## Full file inventory",
    "",
    "| File | Package | Layer | Target environment | Source |",
    "| --- | --- | --- | --- | --- |"
  );

  for (const file of inventory.files) {
    lines.push(
      `| \`${file.path}\` | \`${file.package}\` | \`${file.layer}\` | \`${file.targetEnvironment}\` | ${file.source} |`
    );
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * @param {Set<string>} livePaths
 * @param {Set<string>} storedPaths
 * @returns {string[]}
 */
function collectPathDriftErrors(livePaths, storedPaths) {
  const errors = [];

  for (const filePath of livePaths) {
    if (!storedPaths.has(filePath)) {
      errors.push(`Inventory missing file: ${filePath}`);
    }
  }

  for (const filePath of storedPaths) {
    if (!livePaths.has(filePath)) {
      errors.push(`Inventory stale entry (file removed): ${filePath}`);
    }
  }

  return errors;
}

/**
 * @param {ClassifiedTestFile[]} liveFiles
 * @param {ClassifiedTestFile[]} storedFiles
 * @returns {string[]}
 */
function collectMetadataDriftErrors(liveFiles, storedFiles) {
  const errors = [];
  const storedByPath = new Map(storedFiles.map((file) => [file.path, file]));

  for (const liveFile of liveFiles) {
    const storedFile = storedByPath.get(liveFile.path);
    if (!storedFile) {
      continue;
    }

    if (storedFile.layer !== liveFile.layer) {
      errors.push(
        `${liveFile.path}: layer drift (stored ${storedFile.layer}, live ${liveFile.layer})`
      );
    }

    if (storedFile.targetEnvironment !== liveFile.targetEnvironment) {
      errors.push(
        `${liveFile.path}: environment drift (stored ${storedFile.targetEnvironment}, live ${liveFile.targetEnvironment})`
      );
    }
  }

  return errors;
}

/**
 * @param {TestEnvironmentInventory} stored
 * @param {TestEnvironmentInventory} live
 * @returns {string[]}
 */
function collectCountDriftErrors(stored, live) {
  const errors = [];

  if (stored.vitestFileCount !== live.vitestFileCount) {
    errors.push(
      `Vitest file count drift (stored ${stored.vitestFileCount}, live ${live.vitestFileCount})`
    );
  }

  if (stored.e2eFileCount !== live.e2eFileCount) {
    errors.push(`E2E file count drift (stored ${stored.e2eFileCount}, live ${live.e2eFileCount})`);
  }

  return errors;
}

/**
 * @param {string} root
 * @param {string} inventoryPath
 * @returns {string[]}
 */
export function validateTestEnvironmentInventory(root, inventoryPath) {
  const live = buildTestEnvironmentInventory(root);

  if (!existsSync(inventoryPath)) {
    return [
      `Missing inventory file: ${path.relative(root, inventoryPath)} — run pnpm run test:classify`,
    ];
  }

  const stored = /** @type {TestEnvironmentInventory} */ (
    JSON.parse(readFileSync(inventoryPath, "utf8"))
  );

  const livePaths = new Set(live.files.map((file) => file.path));
  const storedPaths = new Set(stored.files.map((file) => file.path));

  return [
    ...collectPathDriftErrors(livePaths, storedPaths),
    ...collectMetadataDriftErrors(live.files, stored.files),
    ...collectCountDriftErrors(stored, live),
  ];
}

/**
 * @param {string} root
 * @param {string} outputDir
 */
export function writeInventoryArtifacts(root, outputDir) {
  const inventory = buildTestEnvironmentInventory(root);
  mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "test-environment-inventory.json");
  const mdPath = path.join(outputDir, "test-environment-inventory.md");

  writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`);
  writeFileSync(mdPath, `${renderInventoryMarkdown(inventory)}\n`);

  const biome = path.join(root, "node_modules", ".bin", "biome");
  if (existsSync(biome)) {
    spawnSync(biome, ["format", "--write", jsonPath, mdPath], { cwd: root, stdio: "ignore" });
  }

  return { jsonPath, mdPath, inventory };
}

function parseArgs(argv) {
  const args = { write: false, output: path.join(defaultRoot, "benchmarks") };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") {
      args.write = true;
    } else if (arg === "--output" && argv[index + 1]) {
      args.output = path.resolve(argv[index + 1]);
      index += 1;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inventory = buildTestEnvironmentInventory(defaultRoot);

  process.stdout.write(
    `Classified ${inventory.vitestFileCount} Vitest files and ${inventory.e2eFileCount} Playwright files.\n`
  );
  process.stdout.write(
    `  node=${inventory.environmentCounts.node} happy-dom=${inventory.environmentCounts["happy-dom"]} jsdom=${inventory.environmentCounts.jsdom} playwright=${inventory.environmentCounts.playwright}\n`
  );

  if (args.write) {
    const { jsonPath, mdPath } = writeInventoryArtifacts(defaultRoot, args.output);
    process.stdout.write(`Wrote ${path.relative(defaultRoot, jsonPath)}\n`);
    process.stdout.write(`Wrote ${path.relative(defaultRoot, mdPath)}\n`);
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main();
}
