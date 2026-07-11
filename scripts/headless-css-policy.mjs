/**
 * Headless CSS policy for `packages/**`.
 *
 * Production headless packages MUST NOT ship visual opinions. Development-only
 * tooling (Query Devtools) is exempt when located under scoped paths below.
 *
 * @see AGENTS.md — "Development tooling exception"
 */

/** @typedef {{ id: string; pattern: RegExp; message: string }} HeadlessCssViolationPattern */

/**
 * Source paths (relative to repo root) allowed to ship styled development UI.
 * Keep in sync with AGENTS.md and `.cursor/rules/devtools-tooling.mdc`.
 *
 * @type {readonly RegExp[]}
 */
export const DEVELOPMENT_TOOLING_PATHS = [/^packages\/query-kit\/src\/devtools\//];

/**
 * Patterns that indicate styled UI leaking into headless package source.
 *
 * @type {readonly HeadlessCssViolationPattern[]}
 */
export const HEADLESS_CSS_VIOLATION_PATTERNS = [
  {
    id: "devtools-style-surface",
    pattern: /\bUI_STYLES\b/,
    message: "styled UI surface (UI_STYLES) is only allowed in development-tooling paths",
  },
  {
    id: "devtools-token-prefix",
    pattern: /--aq-(?:background|foreground|border|primary)\b/,
    message: "devtools CSS tokens (--aq-*) are only allowed in development-tooling paths",
  },
  {
    id: "devtools-class-prefix",
    pattern: /aq-devtools-/,
    message: "devtools class names (aq-devtools-*) are only allowed in development-tooling paths",
  },
  {
    id: "host-dark-selector",
    pattern: /:root\.dark\b|:root\[data-theme=["']dark["']\]/,
    message:
      'host theme selectors (:root.dark, :root[data-theme="dark"]) are prohibited in headless packages',
  },
];

const SOURCE_FILE_PATTERN = /\.(?:[cm]?ts|[cm]?js)$/;

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isDevelopmentToolingPath(relativePath) {
  return DEVELOPMENT_TOOLING_PATHS.some((pattern) => pattern.test(relativePath));
}

/**
 * @param {string} relativePath
 * @returns {boolean}
 */
export function isHeadlessCssScanPath(relativePath) {
  if (!relativePath.startsWith("packages/")) {
    return false;
  }

  if (!SOURCE_FILE_PATTERN.test(relativePath)) {
    return false;
  }

  if (relativePath.includes("/test/") || relativePath.includes("/dist/")) {
    return false;
  }

  return !isDevelopmentToolingPath(relativePath);
}

/**
 * @param {string} source
 * @param {readonly HeadlessCssViolationPattern[]} [patterns]
 * @returns {HeadlessCssViolationPattern[]}
 */
export function findHeadlessCssViolations(source, patterns = HEADLESS_CSS_VIOLATION_PATTERNS) {
  return patterns.filter((rule) => rule.pattern.test(source));
}

/**
 * @param {string} root
 * @param {(dir: string, visit: (filePath: string) => void) => void} readDirRecursive
 * @returns {string[]}
 */
export function validateHeadlessCssPolicy(root, readDirRecursive) {
  const errors = [];
  const packagesDir = `${root}/packages`.replace(/\/+/g, "/");

  readDirRecursive(packagesDir, (filePath) => {
    const relativePath = filePath.slice(root.length + 1).replace(/\\/g, "/");

    if (!isHeadlessCssScanPath(relativePath)) {
      return;
    }

    const source = /** @type {string} */ (
      // readFileSync is injected by repo-check to avoid duplicating fs imports here during tests
      validateHeadlessCssPolicy.readFile?.(filePath) ?? ""
    );

    if (!source) {
      return;
    }

    for (const violation of findHeadlessCssViolations(source)) {
      errors.push(
        `${relativePath}: ${violation.message} (${violation.id}); move styling into a development-tooling path or remove it`
      );
    }
  });

  return errors;
}

/** @type {{ readFile?: (filePath: string) => string }} */
validateHeadlessCssPolicy.readFile = undefined;
