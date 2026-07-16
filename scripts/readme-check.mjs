import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { REPO_CHECK_POLICY } from "./repo-check-policy.mjs";

/** @typedef {{ name?: string; peerDependencies?: Record<string, string>; peerDependenciesMeta?: Record<string, { optional?: boolean }> }} PackageManifest */

/** @typedef {{ level: number; title: string; line: number }} ReadmeSection */

const QUICK_START_TITLES = new Set([
  "quick start",
  "quick example",
  "setup",
  "usage",
  "alpine usage",
  "headless usage (no alpine)",
  "standalone usage (no alpine)",
]);
const ARCHITECTURE_TITLES = new Set([
  "architecture",
  "why",
  "architectural role",
  "state model",
  "what ships in this phase",
  "tests",
  "roadmap",
  "what this package is not",
  "contribution checklist",
  "css-framework agnostic",
  "magics",
]);
const FORBIDDEN_INSTALL_PATTERNS = [
  /\bnpm install\b/,
  /\byarn add\b/,
  /\]\(\.\.\/\.\.\/docs\/plugins\//,
  /\[Full documentation →\]\(\.\.\/\.\.\/docs\//,
];

/**
 * @param {string} content
 * @returns {ReadmeSection[]}
 */
export function parseReadmeSections(content) {
  /** @type {ReadmeSection[]} */
  const sections = [];

  for (const [index, line] of content.split("\n").entries()) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }

    sections.push({
      level: match[1].length,
      title: match[2].replace(/\s+—.*$/, "").trim(),
      line: index + 1,
    });
  }

  return sections;
}

/**
 * @param {ReadmeSection[]} sections
 * @param {string} title
 * @returns {ReadmeSection | undefined}
 */
function findLevel2Section(sections, title) {
  const normalized = title.toLowerCase();
  return sections.find(
    (section) => section.level === 2 && section.title.toLowerCase() === normalized
  );
}

/**
 * @param {ReadmeSection} section
 * @returns {boolean}
 */
function isInstallSection(section) {
  return section.level === 2 && section.title.toLowerCase().startsWith("install");
}

/**
 * @param {ReadmeSection} section
 * @returns {boolean}
 */
function isQuickStartSection(section) {
  const title = section.title.toLowerCase();
  return (
    section.level === 2 &&
    (QUICK_START_TITLES.has(title) ||
      title.startsWith("quick start") ||
      title.startsWith("headless usage") ||
      title.startsWith("alpine usage") ||
      title.startsWith("standalone usage"))
  );
}

/**
 * @param {PackageManifest} packageJson
 * @returns {string[]}
 */
export function getRequiredInstallPeers(packageJson) {
  const peers = packageJson.peerDependencies ?? {};
  const meta = packageJson.peerDependenciesMeta ?? {};

  return Object.keys(peers)
    .filter((name) => name !== "@types/alpinejs")
    .filter((name) => !meta[name]?.optional)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string} packageName
 * @param {readonly string[]} requiredPeers
 * @returns {string}
 */
export function formatInstallCommand(packageName, requiredPeers) {
  const packageNames = packageName ? [packageName, ...requiredPeers] : [...requiredPeers];
  const unique = [...new Set(packageNames)].sort((a, b) => a.localeCompare(b));
  const primary = packageName ?? unique[0];
  const rest = unique.filter((name) => name !== primary).sort((a, b) => a.localeCompare(b));

  return `pnpm add ${[primary, ...rest].join(" ")}`;
}

/**
 * @param {string} content
 * @returns {string[]}
 */
export function extractPrimaryInstallPackages(content) {
  const installMatch = /## Install[^\n]*\n+```(?:bash|sh)\n(pnpm add[^\n`]+)/.exec(content);
  if (!installMatch) {
    return [];
  }

  return installMatch[1]
    .replace(/^pnpm add\s+/, "")
    .trim()
    .split(/\s+/);
}

/**
 * @param {string} content
 * @param {{ packageFolder: string; packageJson?: PackageManifest }} options
 * @returns {string[]}
 */
export function validateInstallPeers(content, options) {
  if (!options.packageJson?.name) {
    return [];
  }

  const requiredPeers = getRequiredInstallPeers(options.packageJson);
  if (requiredPeers.length === 0) {
    return [];
  }

  const installed = new Set(extractPrimaryInstallPackages(content));
  const errors = [];

  for (const peer of requiredPeers) {
    if (!installed.has(peer)) {
      errors.push(
        `${options.packageFolder}: Install command is missing required peer dependency "${peer}"`
      );
    }
  }

  return errors;
}

/**
 * @param {string} content
 * @param {{ packageFolder: string; packageJson?: PackageManifest }} options
 * @returns {string[]}
 */
export function validateReadmeContent(content, options) {
  const errors = [];
  const sections = parseReadmeSections(content);
  const level2 = sections.filter((section) => section.level === 2);

  if (!/^#\s+(`)?@ailuracode\/alpine-/.test(content.trimStart())) {
    errors.push(
      `${options.packageFolder}: README must start with an @ailuracode/alpine-* H1 title`
    );
  }

  const install = level2.find(isInstallSection);
  if (!install) {
    errors.push(`${options.packageFolder}: README is missing a required "## Install" section`);
  }

  const quickStart = level2.find(isQuickStartSection);
  if (!quickStart) {
    errors.push(
      `${options.packageFolder}: README is missing a required quick-start section (## Quick start)`
    );
  }

  if (!findLevel2Section(sections, "license")) {
    errors.push(`${options.packageFolder}: README is missing a required "## License" section`);
  }

  if (install && quickStart && quickStart.line < install.line) {
    errors.push(
      `${options.packageFolder}: quick-start section must appear after "## Install" (found "${quickStart.title}" before Install)`
    );
  }

  const firstArchitecture = level2.find((section) =>
    ARCHITECTURE_TITLES.has(section.title.toLowerCase())
  );
  if (install && firstArchitecture && firstArchitecture.line < install.line) {
    errors.push(
      `${options.packageFolder}: "${firstArchitecture.title}" must appear after "## Install"`
    );
  }
  if (quickStart && firstArchitecture && firstArchitecture.line < quickStart.line) {
    errors.push(
      `${options.packageFolder}: "${firstArchitecture.title}" must appear after the quick-start section`
    );
  }

  for (const pattern of FORBIDDEN_INSTALL_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(
        `${options.packageFolder}: README contains forbidden pattern ${pattern.toString()}`
      );
    }
  }

  if (/\b## Installation\b/.test(content)) {
    errors.push(`${options.packageFolder}: use "## Install" instead of "## Installation"`);
  }

  const nonStandardQuickStart = level2.find(
    (section) =>
      section.level === 2 &&
      ["quick example", "setup", "usage"].includes(section.title.toLowerCase())
  );
  if (nonStandardQuickStart) {
    errors.push(
      `${options.packageFolder}: rename "## ${nonStandardQuickStart.title}" to "## Quick start" for consistent section naming`
    );
  }

  errors.push(...validateInstallPeers(content, options));

  return errors;
}

/**
 * @param {string} root
 * @param {readonly string[]} packageFolders
 * @returns {string[]}
 */
export function validatePackageReadmes(root, packageFolders) {
  const errors = [];

  for (const folder of packageFolders) {
    const readmePath = path.join(root, "packages", folder, "README.md");
    if (!existsSync(readmePath)) {
      errors.push(`readme-check: missing README for package "${folder}"`);
      continue;
    }

    const content = readFileSync(readmePath, "utf8");
    const packageJsonPath = path.join(root, "packages", folder, "package.json");
    const packageJson = existsSync(packageJsonPath)
      ? /** @type {PackageManifest} */ (JSON.parse(readFileSync(packageJsonPath, "utf8")))
      : {};
    errors.push(...validateReadmeContent(content, { packageFolder: folder, packageJson }));
  }

  return errors;
}

/**
 * @param {string} packagesDir
 * @returns {string[]}
 */
export function discoverPublicPackageFolders(packagesDir) {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((folder) => !REPO_CHECK_POLICY.catalogExcluded.includes(folder))
    .sort();
}

/**
 * @param {string} content
 * @param {string} sectionTitle
 * @returns {string[]}
 */
export function extractInstallPackagesFromSection(content, sectionTitle) {
  const headingIndex = content.search(new RegExp(`^## ${sectionTitle}`, "m"));
  if (headingIndex === -1) {
    return [];
  }

  const afterHeading = content.slice(headingIndex);
  const codeMatch = /```(?:bash|sh)\n([\s\S]*?)```/.exec(afterHeading);
  if (!codeMatch) {
    return [];
  }

  const command = codeMatch[1].replace(/\\\n\s*/g, " ");
  const addMatch = /pnpm add\s+([\s\S]+)/.exec(command);
  if (!addMatch) {
    return [];
  }

  return addMatch[1].trim().split(/\s+/);
}

/**
 * @param {string} [root]
 * @returns {string[]}
 */
export function validateGettingStartedInstall(root = process.cwd()) {
  const guidePath = path.join(root, "docs/getting-started.md");
  if (!existsSync(guidePath)) {
    return ["getting-started: missing docs/getting-started.md"];
  }

  const content = readFileSync(guidePath, "utf8");
  const installed = new Set(extractInstallPackagesFromSection(content, "Install essentials"));
  const errors = [];

  if (installed.size === 0) {
    errors.push("getting-started: missing pnpm add block under ## Install essentials");
    return errors;
  }

  if (/\bpnpm install\b/.test(content)) {
    errors.push("getting-started: use pnpm add instead of pnpm install");
  }

  for (const pkg of installed) {
    if (!pkg.startsWith("@ailuracode/alpine-")) {
      continue;
    }

    const folder = pkg.slice("@ailuracode/alpine-".length);
    const packageJsonPath = path.join(root, "packages", folder, "package.json");
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = /** @type {PackageManifest} */ (
      JSON.parse(readFileSync(packageJsonPath, "utf8"))
    );

    for (const peer of getRequiredInstallPeers(packageJson)) {
      if (!installed.has(peer)) {
        errors.push(
          `getting-started: Install essentials is missing required peer "${peer}" for "${pkg}"`
        );
      }
    }
  }

  return errors;
}

/**
 * @param {string} [root]
 * @returns {string[]}
 */
export function validateReadmes(root = process.cwd()) {
  const packagesDir = path.join(root, "packages");
  const packageFolders = discoverPublicPackageFolders(packagesDir);
  return [...validatePackageReadmes(root, packageFolders), ...validateGettingStartedInstall(root)];
}

function main() {
  const errors = validateReadmes();
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }

  console.log("readme-check: ok");
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main();
}
